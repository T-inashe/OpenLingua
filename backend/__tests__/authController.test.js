const { register, login, logout, me } = require('../src/controllers/authController');
const { prisma } = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');
const { generateTokens } = require('../src/utils/jwt');
const { setAuthCookies, clearAuthCookies } = require('../src/utils/cookies');

jest.mock('../src/lib/prisma');
jest.mock('bcryptjs');
jest.mock('../src/utils/jwt');
jest.mock('../src/utils/cookies');
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};


describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if missing fields', async () => {
      const req = { body: { email: '', password: '', name: '' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('should return 400 for invalid email', async () => {
      const req = { body: { email: 'bademail', password: 'password123', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for short password', async () => {
      const req = { body: { email: 'test@example.com', password: 'short', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      const req = { body: { email: 'test@example.com', password: 'password123', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create user and return 201', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test' });
      generateTokens.mockReturnValue({ accessToken: 'a', refreshToken: 'r' });
      const req = { body: { email: 'test@example.com', password: 'password123', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), user: expect.any(Object) }));
      expect(setAuthCookies).toHaveBeenCalled();
    });

    it('should handle Prisma unique constraint error (P2002)', async () => {
      const prismaError = { code: 'P2002' };
      prisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockRejectedValue(prismaError);

      const req = { body: { email: 'unique@example.com', password: 'password123', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'An account with this email already exists' })
      );
    });

    it('should handle unexpected error during registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      prisma.user.create.mockRejectedValue(new Error('Unexpected'));

      const req = { body: { email: 'fail@example.com', password: 'password123', name: 'Test' } };
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Something went wrong') })
      );
    });
  });

  describe('login', () => {
    it('should return 400 if missing fields', async () => {
      const req = { body: { email: '', password: '' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if password invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test', password: 'hashed' });
      bcrypt.compare.mockResolvedValue(false);
      const req = { body: { email: 'test@example.com', password: 'wrongpass' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should login and return user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test', password: 'hashed' });
      bcrypt.compare.mockResolvedValue(true);
      generateTokens.mockReturnValue({ accessToken: 'a', refreshToken: 'r' });
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = mockRes();
      await login(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), user: expect.any(Object) }));
      expect(setAuthCookies).toHaveBeenCalled();
    });

    it('should handle unexpected error during login', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Unexpected'));
      const req = { body: { email: 'fail@example.com', password: 'password123' } };
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Something went wrong') })
      );
    });
  });

  describe('logout', () => {
    it('should clear cookies and return success', async () => {
      const req = {};
      const res = mockRes();
      await logout(req, res);
      expect(clearAuthCookies).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle error during logout', async () => {
      clearAuthCookies.mockImplementation(() => { throw new Error('fail'); });
      const req = {};
      const res = mockRes();
      await logout(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Something went wrong') })
      );
    });
  });

  describe('me', () => {
    it('should return user if found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com', name: 'Test' });
      const req = { user: { userId: 1 } };
      const res = mockRes();
      await me(req, res);
      expect(res.json).toHaveBeenCalledWith({ user: expect.any(Object) });
    });

    it('should return 404 if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const req = { user: { userId: 1 } };
      const res = mockRes();
      await me(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error during me', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('fail'));
      const req = { user: { userId: 1 } };
      const res = mockRes();
      await me(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Something went wrong') })
      );
    });
  });
});