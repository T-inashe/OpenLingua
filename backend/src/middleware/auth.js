/* istanbul ignore file */

const { verifyAccessToken, verifyRefreshToken, generateTokens } = require('../utils/jwt');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');
const { prisma } = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        req.user = payload;
        return next();
      } catch (error) {
        // Try refresh token
      }
    }

    if (refreshToken) {
      try {
        const { userId } = verifyRefreshToken(refreshToken);
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true }
        });

        if (!user) {
          clearAuthCookies(res);
          return res.status(401).json({ error: 'User not found' });
        }

        const tokens = generateTokens({
          userId: user.id,
          email: user.email,
        });

        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        req.user = { userId: user.id, email: user.email };
        return next();
      } catch (error) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Session expired, please login again' });
      }
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  authenticate
};