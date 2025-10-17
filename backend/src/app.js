const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const prisma = require('./lib/prisma');

require('./config/passport');

const app = express();

// CORS configuration - SIMPLIFIED
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://openlingua-gch4g8bsfmhahkhm.eastus-01.azurewebsites.net',
    'https://nice-beach-0bc35a310.4.azurestaticapps.net'
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

// Session configuration
app.use(
  session({
    name: 'sessionId',
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
      }
    ),
    cookie: {
      secure: false, // Set to false for local development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax', // Use 'lax' for local development
      path: '/',
    },
    proxy: true
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware - disabled for performance
// Uncomment for debugging if needed
// app.use((req, res, next) => {
//   console.log('=== Request Debug ===');
//   console.log('Path:', req.path);
//   console.log('User:', req.user?.email || 'undefined');
//   console.log('====================');
//   next();
// });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/vocab', require('./routes/vocabRoutes'));
app.use('/api/forum', require('./routes/forumRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.path);
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