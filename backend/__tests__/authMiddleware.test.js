const { authenticate } = require('../src/middleware/auth');
const jwtUtils = require('../src/utils/jwt');
const cookieUtils = require('../src/utils/cookies');
const { prisma } = require('../src/lib/prisma');

jest.mock('../src/utils/jwt');
jest.mock('../src/utils/cookies');
jest.mock('../src/lib/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('middleware/authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when no tokens', async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('accepts valid access token', async () => {
    const req = { cookies: { accessToken: 'a' } };
    const res = mockRes();
    const next = jest.fn();
    jwtUtils.verifyAccessToken.mockReturnValue({ userId: 'u1', email: 't@example.com' });

    await authenticate(req, res, next);

    expect(req.user).toEqual({ userId: 'u1', email: 't@example.com' });
    expect(next).toHaveBeenCalled();
  });

  test('uses refresh token when access token invalid', async () => {
    const req = { cookies: { accessToken: 'bad', refreshToken: 'r' } };
    const res = mockRes();
    const next = jest.fn();

    jwtUtils.verifyAccessToken.mockImplementation(() => { throw new Error('invalid'); });
    jwtUtils.verifyRefreshToken.mockReturnValue({ userId: 'u2' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'x@example.com' });
    jwtUtils.generateTokens.mockReturnValue({ accessToken: 'na', refreshToken: 'nr' });

    await authenticate(req, res, next);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u2' }, select: { id: true, email: true } });
    expect(cookieUtils.setAuthCookies).toHaveBeenCalledWith(res, 'na', 'nr');
    expect(req.user).toEqual({ userId: 'u2', email: 'x@example.com' });
    expect(next).toHaveBeenCalled();
  });

  test('returns 401 when user not found for refresh token', async () => {
    const req = { cookies: { refreshToken: 'r' } };
    const res = mockRes();
    const next = jest.fn();

    jwtUtils.verifyRefreshToken.mockReturnValue({ userId: 'missing' });
    prisma.user.findUnique.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(cookieUtils.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when refresh token invalid/expired', async () => {
    const req = { cookies: { refreshToken: 'r' } };
    const res = mockRes();
    const next = jest.fn();

    jwtUtils.verifyRefreshToken.mockImplementation(() => { throw new Error('expired'); });

    await authenticate(req, res, next);

    expect(cookieUtils.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Session expired, please login again' });
    expect(next).not.toHaveBeenCalled();
  });
});


