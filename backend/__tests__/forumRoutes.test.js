const express = require('express');
const request = require('supertest');

const mockAuthenticate = jest.fn((req, res, next) => next());
jest.mock('../src/middleware/auth', () => ({ authenticate: (...args) => mockAuthenticate(...args) }));

const mockForumController = {
  createPost: jest.fn((req, res) => res.status(201).json({ ok: true })),
  replyToPost: jest.fn((req, res) => res.status(201).json({ ok: true })),
  getPosts: jest.fn((req, res) => res.json({ ok: true })),
};
jest.mock('../src/controllers/forumController', () => mockForumController);

const forumRoutes = require('../src/routes/forumRoutes');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/forum', forumRoutes);
  return app;
};

describe('forumRoutes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('POST /api/forum/:courseId uses authenticate and createPost', async () => {
    const res = await request(makeApp()).post('/api/forum/abc').send({});
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockForumController.createPost).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  test('GET /api/forum/:courseId uses authenticate and getPosts', async () => {
    const res = await request(makeApp()).get('/api/forum/abc');
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockForumController.getPosts).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /api/forum/reply/:postId uses authenticate and replyToPost', async () => {
    const res = await request(makeApp()).post('/api/forum/reply/xyz').send({});
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockForumController.replyToPost).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });
});
