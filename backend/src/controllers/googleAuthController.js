const prisma = require('../lib/prisma');

exports.googleCallback = async (req, res) => {
  try {
    console.log('Google callback - User:', req.user);
    console.log('Google callback - Session ID:', req.sessionID);
    
    if (!req.user) {
      console.error('No user in request after Google auth');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?error=auth_failed`);
    }

    // Ensure session is saved before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?error=session_failed`);
      }
      
      console.log('✅ Session saved successfully');
      console.log('Session data:', req.session);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?error=server_error`);
  }
};

exports.googleAuth = (req, res, next) => {
  console.log('Initiating Google OAuth...');
  next();
};