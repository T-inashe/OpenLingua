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
  windowMs: 15 * 60 * 10000000,
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

// configure Multer to save files to /uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // store file path in Postgres
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({ fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "File upload failed" });
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
module.exports = app;