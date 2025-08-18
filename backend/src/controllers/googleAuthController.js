const passport = require('../config/passport');
const { generateTokens } = require('../utils/jwt');
const { setAuthCookies } = require('../utils/cookies');

// Initiate Google OAuth - wrap in a function
const googleAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

// Handle Google OAuth callback
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { 
    session: false
  }, async (err, user, info) => {
    try {
      if (err) {
        console.error('Google auth error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
      }

      if (!user) {
        console.error('No user returned from Google auth');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Generate JWT tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Set auth cookies
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      // Redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);

    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  })(req, res, next);
};

module.exports = {
  googleAuth,
  googleCallback
};