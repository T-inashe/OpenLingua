const jwt = require('jsonwebtoken');
const {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../src/utils/jwt');

jest.mock('jsonwebtoken');

describe('jwt utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
  });

  it('generateTokens returns access and refresh tokens', () => {
    jwt.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const payload = { userId: 1, email: 'test@example.com' };
    const tokens = generateTokens(payload);

    expect(jwt.sign).toHaveBeenCalledWith(
      payload,
      'access-secret',
      { expiresIn: '15m' }
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { userID: payload.userId },
      'refresh-secret',
      { expiresIn: '7d' }
    );
    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('verifyAccessToken calls jwt.verify with access secret', () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    const token = 'access-token';
    const result = verifyAccessToken(token);
    expect(jwt.verify).toHaveBeenCalledWith(token, 'access-secret');
    expect(result).toEqual({ userId: 1 });
  });

  it('verifyRefreshToken calls jwt.verify with refresh secret', () => {
    jwt.verify.mockReturnValue({ userID: 1 });
    const token = 'refresh-token';
    const result = verifyRefreshToken(token);
    expect(jwt.verify).toHaveBeenCalledWith(token, 'refresh-secret');
    expect(result).toEqual({ userID: 1 });
  });
});