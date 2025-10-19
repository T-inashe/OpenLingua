const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const compression = require('compression');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = require('./lib/prisma');
const quizRoutes = require("./routes/quizRoutes");

require('./config/passport');

const app = express();

// Enable gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression ratio
}));

// CORS configuration - SIMPLIFIED
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'https://openlingua-gch4g8bsfmhahkhm.southafricanorth-01.azurewebsites.net',
    'https://witty-hill-0b304211e.2.azurestaticapps.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Azure
app.set('trust proxy', 1);

// Session configuration with resilient store initialization
const sessionOptions = {
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In production (deployed to Azure) we need Secure + SameSite=None
    // so that cookies are sent on cross-site requests from the static frontend
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  },
  proxy: true,
};

try {
  // Try to initialize Prisma-backed session store. If the database is
  // unavailable this may throw; fall back to the default MemoryStore.
  const prismaStore = new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
  });
  sessionOptions.store = prismaStore;
  console.log('✅ PrismaSessionStore initialized');
} catch (err) {
  console.error('⚠️ PrismaSessionStore initialization failed — falling back to MemoryStore. Error:', err?.message || err);
  // Do not set sessionOptions.store -> express-session will use MemoryStore
}

app.use(session(sessionOptions));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware - only log in development if DEBUG env var is set
if (process.env.DEBUG === 'true') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/vocab', require('./routes/vocabRoutes'));
app.use('/api/forum', require('./routes/forumRoutes'));
app.use("/api", quizRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Language Learning API is running!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    // Quick check whether the database is reachable
    await prisma.$queryRaw('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;