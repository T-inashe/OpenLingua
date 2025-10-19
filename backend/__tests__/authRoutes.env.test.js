const express = require('express');
const request = require('supertest');

describe('auth routes FRONTEND_URL branches', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('uses default FRONTEND_URL when env is unset (covers failureRedirect and redirect)', async () => {
    delete process.env.FRONTEND_URL;

    let mockAuthenticate;
    jest.isolateModules(() => {
      mockAuthenticate = jest.fn((strategy, options) => {
        return (req, res, next) => {
          // Simulate failure when query fail=1 to hit failureRedirect
          if (req.path.endsWith('/google/callback') && req.query.fail === '1') {
            return res.redirect(options.failureRedirect);
          }
          // Otherwise simulate success
          if (req.path.endsWith('/google/callback')) {
            req.user = { email: 'u@example.com' };
          }
          next();
        };
      });

      jest.doMock('passport', () => ({ authenticate: mockAuthenticate }));

      const router = require('../src/routes/auth');

      // Assert failureRedirect picked default URL at module eval time
      const calls = mockAuthenticate.mock.calls;
      const cbCall = calls.find(([, opts]) => opts && Object.prototype.hasOwnProperty.call(opts, 'failureRedirect'));
      expect(cbCall[1].failureRedirect).toBe('http://localhost:5173/signin?error=google_auth_failed');

      const app = express();
      jest.spyOn(console, 'log').mockImplementation(() => {});
      app.use('/auth', router);

      // success path -> redirect to default dashboard
      return (async () => {
        const resSuccess = await request(app).get('/auth/google/callback');
        expect(resSuccess.status).toBe(302);
        expect(resSuccess.headers.location).toBe('http://localhost:5173/dashboard');

        // failure path -> redirected to default failureRedirect
        const resFail = await request(app).get('/auth/google/callback?fail=1');
        expect(resFail.status).toBe(302);
        expect(resFail.headers.location).toBe('http://localhost:5173/signin?error=google_auth_failed');
      })();
    });
  });

  test('uses configured FRONTEND_URL when env is set (covers failureRedirect and redirect)', async () => {
    process.env.FRONTEND_URL = 'http://example.org';

    let mockAuthenticate;
    jest.isolateModules(() => {
      mockAuthenticate = jest.fn((strategy, options) => {
        return (req, res, next) => {
          if (req.path.endsWith('/google/callback') && req.query.fail === '1') {
            return res.redirect(options.failureRedirect);
          }
          if (req.path.endsWith('/google/callback')) {
            req.user = { email: 'user@example.org' };
          }
          next();
        };
      });

      jest.doMock('passport', () => ({ authenticate: mockAuthenticate }));

      const router = require('../src/routes/auth');

      const calls = mockAuthenticate.mock.calls;
      const cbCall = calls.find(([, opts]) => opts && Object.prototype.hasOwnProperty.call(opts, 'failureRedirect'));
      expect(cbCall[1].failureRedirect).toBe('http://example.org/signin?error=google_auth_failed');

      const app = express();
      jest.spyOn(console, 'log').mockImplementation(() => {});
      app.use('/auth', router);

      return (async () => {
        const resSuccess = await request(app).get('/auth/google/callback');
        expect(resSuccess.status).toBe(302);
        expect(resSuccess.headers.location).toBe('http://example.org/dashboard');

        const resFail = await request(app).get('/auth/google/callback?fail=1');
        expect(resFail.status).toBe(302);
        expect(resFail.headers.location).toBe('http://example.org/signin?error=google_auth_failed');
      })();
    });

    delete process.env.FRONTEND_URL;
  });
});
