const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Local authentication routes - NO TRAILING SLASHES
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

// Google OAuth routes - NO TRAILING SLASHES
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?error=google_auth_failed`
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
  }
);

module.exports = router;