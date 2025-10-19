const express = require('express');
const request = require('supertest');

// Mock auth middleware to attach a user and pass through
const mockAuthenticate = jest.fn((req, res, next) => { req.user = { id: 'u1' }; next(); });
// Mock quiz auth middlewares to simple pass-through handlers we can assert
const mockValidateCourseOwnership = jest.fn((req, res, next) => next());
const mockValidateQuizAccess = jest.fn((req, res, next) => next());
const mockQuizRateLimit = jest.fn((req, res, next) => next());
const mockValidateQuizData = jest.fn((req, res, next) => next());
const mockValidateQuizSubmission = jest.fn((req, res, next) => next());
const mockLogQuizOperation = jest.fn(() => (req, res, next) => next());

jest.mock('../src/middleware/auth', () => ({ authenticate: (...args) => mockAuthenticate(...args) }));
jest.mock('../src/middleware/quizAuth', () => ({
  validateCourseOwnership: (...args) => mockValidateCourseOwnership(...args),
  validateQuizAccess: (...args) => mockValidateQuizAccess(...args),
  quizRateLimit: (...args) => mockQuizRateLimit(...args),
  validateQuizData: (...args) => mockValidateQuizData(...args),
  validateQuizSubmission: (...args) => mockValidateQuizSubmission(...args),
  logQuizOperation: () => (req, res, next) => next(),
}));

// Mock Prisma used inside inline quizRoutes handlers
const mockPrisma = { courseQuiz: { findUnique: jest.fn(), findMany: jest.fn() } };
jest.mock('../src/lib/prisma', () => ({ prisma: mockPrisma }));

// Mock controllers and services created via `new`
const mockProxyInstance = {
  createCourseQuiz: jest.fn((req, res) => res.status(201).json({ ok: true })),
  getCourseQuizzes: jest.fn((req, res) => res.json({ ok: true })),
  getQuizDetails: jest.fn((req, res) => res.json({ ok: true })),
  updateQuiz: jest.fn((req, res) => res.json({ ok: true })),
  deleteQuiz: jest.fn((req, res) => res.json({ ok: true })),
  checkApiHealth: jest.fn((req, res) => res.json({ ok: true })),
};
const mockSessionInstance = {
  startQuizSession: jest.fn((req, res) => res.status(201).json({ ok: true })),
  submitQuizAnswers: jest.fn((req, res) => res.json({ ok: true })),
  getQuizResults: jest.fn((req, res) => res.json({ ok: true })),
};
const mockSharingInstance = {
  shareQuizAsTemplate: jest.fn(async () => ({ ok: true })),
  copyTemplateToourse: jest.fn(async () => ({ ok: true })),
  getAvailableTemplates: jest.fn(async () => ({ ok: true })),
  getTemplateDetails: jest.fn(async () => ({ ok: true })),
  unshareTemplate: jest.fn(async () => ({ ok: true })),
  getSharingStats: jest.fn(async () => ({ ok: true })),
};

jest.mock('../src/controllers/quizProxyController', () => ({
  QuizProxyController: jest.fn(() => mockProxyInstance),
}));
jest.mock('../src/controllers/quizSessionController', () => ({
  QuizSessionController: jest.fn(() => mockSessionInstance),
}));
jest.mock('../src/services/quizSharingService', () => ({
  QuizSharingService: jest.fn(() => mockSharingInstance),
}));

const quizRoutes = require('../src/routes/quizRoutes');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', quizRoutes);
  return app;
};

describe('quizRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.courseQuiz.findUnique.mockReset();
    mockPrisma.courseQuiz.findMany && mockPrisma.courseQuiz.findMany.mockReset();
  });

  test('GET /api/quiz-health authenticates and calls checkApiHealth', async () => {
    const res = await request(makeApp()).get('/api/quiz-health');
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockProxyInstance.checkApiHealth).toHaveBeenCalled();
  expect(mockQuizRateLimit).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /api/courses/:courseId/quizzes calls createCourseQuiz with validations', async () => {
    const res = await request(makeApp()).post('/api/courses/c1/quizzes').send({ title: 'q' });
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockValidateCourseOwnership).toHaveBeenCalled();
  expect(mockValidateQuizData).toHaveBeenCalled();
  expect(mockProxyInstance.createCourseQuiz).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  test('GET /api/courses/:courseId/quizzes calls getCourseQuizzes with access check', async () => {
    const res = await request(makeApp()).get('/api/courses/c1/quizzes');
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockValidateQuizAccess).toHaveBeenCalled();
  expect(mockProxyInstance.getCourseQuizzes).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /api/courses/:courseId/quizzes/:quizId calls getQuizDetails', async () => {
    const res = await request(makeApp()).get('/api/courses/c1/quizzes/q1');
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockValidateQuizAccess).toHaveBeenCalled();
    expect(mockProxyInstance.getQuizDetails).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('PUT /api/courses/:courseId/quizzes/:quizId updates a quiz', async () => {
    const res = await request(makeApp())
      .put('/api/courses/c1/quizzes/q1')
      .send({ title: 'updated' });
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockValidateCourseOwnership).toHaveBeenCalled();
    expect(mockValidateQuizData).toHaveBeenCalled();
    expect(mockProxyInstance.updateQuiz).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('DELETE /api/courses/:courseId/quizzes/:quizId deletes a quiz', async () => {
    const res = await request(makeApp()).delete('/api/courses/c1/quizzes/q1');
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockValidateCourseOwnership).toHaveBeenCalled();
    expect(mockProxyInstance.deleteQuiz).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /api/quiz-sessions/:quizId/start resolves courseId and starts session', async () => {
  mockPrisma.courseQuiz.findUnique.mockResolvedValue({ courseId: 'c1' });
    const res = await request(makeApp()).post('/api/quiz-sessions/q1/start').send({});
  expect(mockPrisma.courseQuiz.findUnique).toHaveBeenCalledWith({ where: { id: 'q1' }, select: { courseId: true } });
  expect(mockValidateQuizAccess).toHaveBeenCalled();
  expect(mockSessionInstance.startQuizSession).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  test('POST /api/quiz-sessions/:quizId/submit resolves courseId and submits', async () => {
  mockPrisma.courseQuiz.findUnique.mockResolvedValue({ courseId: 'c1' });
    const res = await request(makeApp()).post('/api/quiz-sessions/q1/submit').send({});
  expect(mockValidateQuizSubmission).toHaveBeenCalled();
  expect(mockValidateQuizAccess).toHaveBeenCalled();
  expect(mockSessionInstance.submitQuizAnswers).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /api/quiz-sessions/:quizId/results resolves courseId and gets results', async () => {
    mockPrisma.courseQuiz.findUnique.mockResolvedValue({ courseId: 'c1' });
    const res = await request(makeApp()).get('/api/quiz-sessions/q1/results');
    expect(mockPrisma.courseQuiz.findUnique).toHaveBeenCalledWith({ where: { id: 'q1' }, select: { courseId: true } });
    expect(mockValidateQuizAccess).toHaveBeenCalled();
    expect(mockSessionInstance.getQuizResults).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('Start quiz session returns 404 when quiz not found', async () => {
    mockPrisma.courseQuiz.findUnique.mockResolvedValue(null);
    const res = await request(makeApp()).post('/api/quiz-sessions/missing/start').send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Quiz not found' });
  });

  test('Submit quiz answers returns 404 when quiz not found', async () => {
    mockPrisma.courseQuiz.findUnique.mockResolvedValue(null);
    const res = await request(makeApp()).post('/api/quiz-sessions/missing/submit').send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Quiz not found' });
  });

  test('Results route returns 404 when quiz not found', async () => {
    mockPrisma.courseQuiz.findUnique.mockResolvedValue(null);
    const res = await request(makeApp()).get('/api/quiz-sessions/missing/results');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Quiz not found' });
  });

  test('Start quiz session returns 500 on prisma error', async () => {
    mockPrisma.courseQuiz.findUnique.mockRejectedValue(new Error('db down'));
    const res = await request(makeApp()).post('/api/quiz-sessions/q1/start').send({});
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to validate quiz' });
  });

  test('Submit quiz answers returns 500 on prisma error', async () => {
    mockPrisma.courseQuiz.findUnique.mockRejectedValue(new Error('db down'));
    const res = await request(makeApp()).post('/api/quiz-sessions/q1/submit').send({});
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to validate quiz' });
  });

  test('Results route returns 500 on prisma error', async () => {
    mockPrisma.courseQuiz.findUnique.mockRejectedValue(new Error('db down'));
    const res = await request(makeApp()).get('/api/quiz-sessions/q1/results');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to validate quiz' });
  });

  // ==================== Sharing & Templates ====================
  test('POST share quiz calls service with params', async () => {
    const res = await request(makeApp())
      .post('/api/courses/c42/quizzes/q99/share')
      .send({ visibility: 'public' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSharingInstance.shareQuizAsTemplate).toHaveBeenCalledWith('q99', 'u1', { visibility: 'public' });
  });

  test('POST copy-template returns 400 when templateId missing', async () => {
    const res = await request(makeApp())
      .post('/api/courses/c42/quizzes/copy-template')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Template ID is required' });
  });

  test('POST copy-template calls service when templateId provided', async () => {
    const res = await request(makeApp())
      .post('/api/courses/c42/quizzes/copy-template')
      .send({ templateId: 't1', customizations: { title: 'New' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSharingInstance.copyTemplateToourse).toHaveBeenCalledWith('t1', 'c42', 'u1', { title: 'New' });
  });

  test('GET /api/quiz-templates calls service with filters', async () => {
    const res = await request(makeApp())
      .get('/api/quiz-templates')
      .query({ category: 'gram', difficulty: 'easy', search: 'verb' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSharingInstance.getAvailableTemplates).toHaveBeenCalledWith('u1', {
      category: 'gram', difficulty: 'easy', search: 'verb'
    });
  });

  test('GET /api/quiz-templates/:templateId calls service', async () => {
    const res = await request(makeApp()).get('/api/quiz-templates/t123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSharingInstance.getTemplateDetails).toHaveBeenCalledWith('t123', 'u1');
  });

  test('DELETE /api/quiz-templates/:templateId calls service', async () => {
    const res = await request(makeApp()).delete('/api/quiz-templates/t999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSharingInstance.unshareTemplate).toHaveBeenCalledWith('t999', 'u1');
  });

  test('GET /api/quiz-sharing-stats calls service', async () => {
    const res = await request(makeApp()).get('/api/quiz-sharing-stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSharingInstance.getSharingStats).toHaveBeenCalledWith('u1');
  });

  // ==================== Analytics ====================
  test('GET /api/courses/:courseId/quiz-analytics aggregates stats', async () => {
    mockPrisma.courseQuiz.findMany.mockResolvedValue([
      {
        id: 'q1',
        title: 'Quiz 1',
        difficulty: 'easy',
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        results: [
          { score: 80, timeSpent: 100, totalQuestions: 10, student: { id: 's1', name: 'A' } },
          { score: 60, timeSpent: 120, totalQuestions: 10, student: { id: 's2', name: 'B' } }
        ],
        _count: { results: 2 },
      }
    ]);
    const res = await request(makeApp()).get('/api/courses/c99/quiz-analytics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.analytics)).toBe(true);
    expect(res.body.summary.totalQuizzes).toBe(1);
  });

  test('GET /api/courses/:courseId/quiz-analytics returns 500 on error', async () => {
    mockPrisma.courseQuiz.findMany.mockRejectedValue(new Error('db oops'));
    const res = await request(makeApp()).get('/api/courses/c99/quiz-analytics');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to get quiz analytics' });
  });
});
