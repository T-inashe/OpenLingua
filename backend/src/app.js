const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const authRoutes = require('./routes/auth');
const courseRoutes = require("./routes/courseRoutes");
const forumRoutes = require("./routes/forumRoutes");
const vocabRoutes = require("./routes/vocabRoutes");
const { supabase } = require('./lib/supabase');
const app = express();
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "0000",
  port: 5432,
});
// ensure uploads folder exists

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

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests, please try again later" }
});

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
app.use('/api/auth', authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/vocab", vocabRoutes);

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

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// expose legacy uploads (existing files) via static route
app.use('/uploads', express.static(uploadDir));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'lesson-media';

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(req.file.originalname);
    const objectKey = `lessons/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(objectKey, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: "File upload failed" });
    }

    const { data: publicData } = supabase.storage.from(storageBucket).getPublicUrl(objectKey);

    if (!publicData?.publicUrl) {
      return res.status(500).json({ error: "Could not retrieve file URL" });
    }

    res.json({ fileUrl: publicData.publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = app;
