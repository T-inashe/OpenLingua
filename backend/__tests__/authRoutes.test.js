const express = require('express');
const request = require('supertest');

// Mocks
const mockRegister = jest.fn((req, res) => res.status(201).json({ ok: true }));
const mockLogin = jest.fn((req, res) => res.json({ ok: true }));
const mockLogout = jest.fn((req, res) => res.json({ ok: true }));
const mockMe = jest.fn((req, res) => res.json({ user: { id: 'u1' } }));

jest.mock('../src/controllers/authController', () => ({
  register: (...args) => mockRegister(...args),
  login: (...args) => mockLogin(...args),
  logout: (...args) => mockLogout(...args),
  me: (...args) => mockMe(...args),
}));

const mockAuthenticate = jest.fn((req, res, next) => { req.user = { id: 'u1' }; next(); });
jest.mock('../src/middleware/auth', () => ({
  authenticate: (...args) => mockAuthenticate(...args),
}));

// Passport authenticate mock that captures strategy and options
const mockPassportAuthenticate = jest.fn((strategy, options) => {
  return (req, res, next) => {
    // For google callback success path, proceed to next
    if (req.path.endsWith('/google/callback') && !req.query.fail) {
      req.user = { email: 'user@example.com' };
      return next();
    }
    // For failure simulation, redirect to failureRedirect if provided
    if (req.path.endsWith('/google/callback') && req.query.fail === '1') {
      return res.redirect(options.failureRedirect);
    }
    // For initial /google, just respond OK to avoid external redirect
    return res.status(200).json({ auth: strategy, options });
  };
});

jest.mock('passport', () => ({
  authenticate: (...args) => mockPassportAuthenticate(...args),
}));

const authRoutes = require('../src/routes/auth');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register calls controller', async () => {
    const res = await request(makeApp())
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'secret' });
    expect(mockRegister).toHaveBeenCalled();
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
  });

  test('POST /api/auth/login calls controller', async () => {
    const res = await request(makeApp())
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'secret' });
    expect(mockLogin).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('POST /api/auth/logout requires authenticate and calls controller', async () => {
    const res = await request(makeApp())
      .post('/api/auth/logout')
      .send();
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /api/auth/me requires authenticate and calls controller', async () => {
    const res = await request(makeApp())
      .get('/api/auth/me');
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockMe).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 'u1' } });
  });

  test('GET /api/auth/google uses passport authenticate with scope', async () => {
    const res = await request(makeApp())
      .get('/api/auth/google');
    expect(res.status).toBe(200);
    expect(res.body.auth).toBe('google');
    expect(res.body.options).toEqual({ scope: ['profile', 'email'] });
  });

  test('GET /api/auth/google/callback success redirects to dashboard', async () => {
    const res = await request(makeApp())
      .get('/api/auth/google/callback');
    // Success should hit next handler which redirects
    expect(res.status).toBe(302);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    expect(res.headers.location).toBe(`${frontend}/dashboard`);
  });

  test('GET /api/auth/google/callback failure redirects to signin with error', async () => {
    const res = await request(makeApp())
      .get('/api/auth/google/callback')
      .query({ fail: '1' });
    expect(res.status).toBe(302);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    expect(res.headers.location).toBe(`${frontend}/signin?error=google_auth_failed`);
  });
});
