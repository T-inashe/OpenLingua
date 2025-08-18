const { Router } = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const { googleAuth, googleCallback } = require('../controllers/googleAuthController'); 
const { authenticate } = require('../middleware/auth');

const router = Router();

// Manual auth routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes - with debug logging
router.get('/google', (req, res, next) => {
  googleAuth(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  googleCallback(req, res, next);
});

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;