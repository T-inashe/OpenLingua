const express = require('express');
const request = require('supertest');

const mockAuthenticate = jest.fn((req, res, next) => next());
jest.mock('../src/middleware/auth', () => ({ authenticate: (...args) => mockAuthenticate(...args) }));

const mockVocabController = {
  addWord: jest.fn((req, res) => res.status(201).json({ ok: true })),
  getWords: jest.fn((req, res) => res.json({ ok: true })),
};
jest.mock('../src/controllers/vocabController', () => mockVocabController);

const vocabRoutes = require('../src/routes/vocabRoutes');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/vocab', vocabRoutes);
  return app;
};

describe('vocabRoutes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('POST /api/vocab/:courseId uses authenticate and addWord', async () => {
    const res = await request(makeApp()).post('/api/vocab/course-1').send({});
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockVocabController.addWord).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  test('GET /api/vocab/:courseId uses authenticate and getWords', async () => {
    const res = await request(makeApp()).get('/api/vocab/course-1');
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockVocabController.getWords).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
