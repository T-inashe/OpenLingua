// src/routes/auth.ts
import { Router } from 'express';
import { register, login, logout, me } from '../controllers/authController';
import { googleAuth, googleCallback } from '../controllers/googleAuthController'; // Fixed typo
import { authenticate } from '../middleware/auth';

const router = Router();

// Manual auth routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes - with debug logging
router.get('/google', (req, res, next) => {
  console.log('Google OAuth route hit!');
  googleAuth(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  console.log('Google callback route hit!');
  googleCallback(req, res, next);
});

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;