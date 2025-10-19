const passport = require('../config/passport');
const { generateTokens } = require('../utils/jwt');
const { setAuthCookies } = require('../utils/cookies');

// Initiate Google OAuth flow
exports.googleAuth = (req, res, next) => {
  console.log('Initiating Google OAuth...');
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

// Handle Google OAuth callback using passport custom callback pattern
exports.googleCallback = (req, res, next) => {
  // Read env at call-time so tests can override
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const SIGNIN_PATH = process.env.FRONTEND_SIGNIN_PATH || '/signin';
  const DASHBOARD_PATH = process.env.FRONTEND_DASHBOARD_PATH || '/dashboard';

  return passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      return res.redirect(`${FRONTEND_URL}${SIGNIN_PATH}?error=oauth_error`);
    }
    if (!user) {
      console.error('No user in request after Google auth');
      return res.redirect(`${FRONTEND_URL}${SIGNIN_PATH}?error=oauth_failed`);
    }

    try {
      const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });
      setAuthCookies(res, accessToken, refreshToken);
      return res.redirect(`${FRONTEND_URL}${DASHBOARD_PATH}`);
    } catch (e) {
      console.error('Google callback error:', e);
      return res.redirect(`${FRONTEND_URL}${SIGNIN_PATH}?error=server_error`);
    }
  })(req, res, next);
};