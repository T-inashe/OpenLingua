const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const authRoutes = require('./routes/auth');
const passport = require('./config/passport');
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

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['POST', 'GET', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests, please try again later" }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many authorisation attempts, please try again later" }
});

app.use(generalLimiter);

app.use('/api/auth/login', authLimiter);    
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/vocab", vocabRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Language Learning API is running!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
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
