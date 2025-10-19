/**
 * Session-based authentication middleware for Passport.js
 * Checks if the user is authenticated via session
 */
const authenticate = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

module.exports = {
  authenticate
};