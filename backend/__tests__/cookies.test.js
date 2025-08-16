const { setAuthCookies, clearAuthCookies } = require('../src/utils/cookies');

describe('cookies utils', () => {
  let res;

  beforeEach(() => {
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  it('setAuthCookies sets access and refresh cookies with correct options', () => {
    setAuthCookies(res, 'access-token', 'refresh-token');
    expect(res.cookie).toHaveBeenCalledWith(
      'accessToken',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
    );
  });

  it('clearAuthCookies clears access and refresh cookies with correct options', () => {
    clearAuthCookies(res);
    expect(res.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    );
  });
});