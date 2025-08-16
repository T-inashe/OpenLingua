const { googleAuth, googleCallback } = require('../src/controllers/googleAuthController');
const passport = require('../src/config/passport');
const { generateTokens } = require('../src/utils/jwt');
const { setAuthCookies } = require('../src/utils/cookies');

jest.mock('../src/config/passport');
jest.mock('../src/utils/jwt');
jest.mock('../src/utils/cookies');

const mockReq = {};
const mockRes = () => {
  const res = {};
  res.redirect = jest.fn();
  return res;
};
const mockNext = jest.fn();

describe('googleAuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('googleAuth', () => {
    it('should call passport.authenticate with correct args', () => {
      const mockAuthenticate = jest.fn(() => (req, res, next) => {});
      passport.authenticate.mockImplementation(mockAuthenticate);

      googleAuth(mockReq, {}, mockNext);

      expect(passport.authenticate).toHaveBeenCalledWith('google', { scope: ['profile', 'email'] });
    });
  });

  describe('googleCallback', () => {
    it('should handle error from passport', async () => {
      const res = mockRes();
      const mockAuthenticate = jest.fn((strategy, options, cb) => (req, res, next) => {
        cb(new Error('fail'), null, null);
      });
      passport.authenticate.mockImplementation(mockAuthenticate);

      process.env.FRONTEND_URL = 'http://localhost:3000';
      await googleCallback(mockReq, res, mockNext);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=oauth_error');
    });

    it('should handle missing user', async () => {
      const res = mockRes();
      const mockAuthenticate = jest.fn((strategy, options, cb) => (req, res, next) => {
        cb(null, null, null);
      });
      passport.authenticate.mockImplementation(mockAuthenticate);

      process.env.FRONTEND_URL = 'http://localhost:3000';
      await googleCallback(mockReq, res, mockNext);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=oauth_failed');
    });

    it('should set cookies and redirect on success', async () => {
      const res = mockRes();
      const user = { id: 1, email: 'test@example.com' };
      const tokens = { accessToken: 'a', refreshToken: 'r' };
      generateTokens.mockReturnValue(tokens);

      const mockAuthenticate = jest.fn((strategy, options, cb) => (req, res, next) => {
        cb(null, user, null);
      });
      passport.authenticate.mockImplementation(mockAuthenticate);

      process.env.FRONTEND_URL = 'http://localhost:3000';
      await googleCallback(mockReq, res, mockNext);

      expect(generateTokens).toHaveBeenCalledWith({ userId: 1, email: 'test@example.com' });
      expect(setAuthCookies).toHaveBeenCalledWith(res, 'a', 'r');
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
    });

    it('should handle exception in callback', async () => {
      const res = mockRes();
      const user = { id: 1, email: 'test@example.com' };
      generateTokens.mockImplementation(() => { throw new Error('jwt error'); });

      const mockAuthenticate = jest.fn((strategy, options, cb) => (req, res, next) => {
        cb(null, user, null);
      });
      passport.authenticate.mockImplementation(mockAuthenticate);

      process.env.FRONTEND_URL = 'http://localhost:3000';
      await googleCallback(mockReq, res, mockNext);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000/login?error=server_error');
    });
  });
});