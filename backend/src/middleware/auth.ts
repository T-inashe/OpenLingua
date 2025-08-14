
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateTokens } from '../utils/jwt';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';
import { prisma } from '../lib/prisma';

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
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