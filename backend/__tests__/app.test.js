const request = require('supertest');

// Mock heavy/side-effectful dependencies used by app.js
jest.mock('express-session', () => () => (req, res, next) => next());
jest.mock('cors', () => () => (req, res, next) => next());
jest.mock('@quixo3/prisma-session-store', () => ({
  PrismaSessionStore: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../src/config/passport', () => ({}));
jest.mock('passport', () => ({
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => next(),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

// Mock route modules to avoid pulling entire stacks
jest.mock('../src/routes/auth', () => require('express').Router());
jest.mock('../src/routes/courseRoutes', () => require('express').Router());
jest.mock('../src/routes/vocabRoutes', () => require('express').Router());
jest.mock('../src/routes/forumRoutes', () => require('express').Router());
jest.mock('../src/routes/quizRoutes', () => require('express').Router());

// Silence noisy debug logs from app
let logSpy;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  logSpy && logSpy.mockRestore();
});

const app = require('../src/app');

describe('app.js core routes', () => {
  test('GET / returns service status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Language Learning API is running!'),
        timestamp: expect.any(String),
      })
    );
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
        database: expect.any(String),
      })
    );
  });

  test('GET /non-existent returns 404 JSON', async () => {
    const res = await request(app).get('/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({ error: 'Not found', path: '/definitely-not-a-route' })
    );
  });
});
