/**
 * JWT cookie-based authentication middleware
 * - Accepts valid access token
 * - Falls back to refresh token to rotate tokens and attach user
 * - Clears cookies and responds with appropriate 401 on failures
 */
const { verifyAccessToken, verifyRefreshToken, generateTokens } = require('../utils/jwt');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');
const { prisma } = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  const { accessToken, refreshToken } = (req.cookies || {});

  // Try access token first
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      req.user = { userId: payload.userId, email: payload.email };
      return next();
    } catch (e) {
      // Fallthrough to refresh token path
    }
  }

  // Try refresh token
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const userId = payload.userId || payload.userID; // support either key

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!user) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'User not found' });
      }

      // Rotate tokens
      const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens({ userId: user.id, email: user.email });
      setAuthCookies(res, newAccess, newRefresh);

      req.user = { userId: user.id, email: user.email };
      return next();
    } catch (e) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Session expired, please login again' });
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
};

module.exports = { authenticate };