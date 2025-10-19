const express = require('express');
const request = require('supertest');

// Mock middleware and controller handlers
const mockAuthenticate = jest.fn((req, res, next) => next());
jest.mock('../src/middleware/auth', () => ({ authenticate: (...args) => mockAuthenticate(...args) }));

const mockCourseController = {
  createCourse: jest.fn((req, res) => res.status(201).json({ ok: true })),
  getCourses: jest.fn((req, res) => res.json({ ok: true })),
  getCourseDetails: jest.fn((req, res) => res.json({ ok: true })),
  joinCourse: jest.fn((req, res) => res.json({ ok: true })),
  leaveCourse: jest.fn((req, res) => res.json({ ok: true })),
  getCoursesByUserId: jest.fn((req, res) => res.json({ ok: true })),
  getJoinedCoursesByUserId: jest.fn((req, res) => res.json({ ok: true })),
  getForumMessagesByCourseId: jest.fn((req, res) => res.json({ ok: true })),
  getJoinedCoursesByUserIdAndCourseId: jest.fn((req, res) => res.json({ ok: true })),
  getJoinedCoursesByCourseId: jest.fn((req, res) => res.json({ ok: true })),
  translateText: jest.fn((req, res) => res.json({ ok: true })),
  getCourseReviews: jest.fn((req, res) => res.json({ ok: true })),
  postCourseReview: jest.fn((req, res) => res.status(201).json({ ok: true })),
  updateCourse: jest.fn((req, res) => res.json({ ok: true })),
  deleteCourse: jest.fn((req, res) => res.json({ ok: true })),
  updateCourseProgress: jest.fn((req, res) => res.json({ ok: true })),
};

jest.mock('../src/controllers/courseController', () => mockCourseController);

const courseRoutes = require('../src/routes/courseRoutes');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/courses', courseRoutes);
  return app;
};

describe('courseRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/courses uses createCourse', async () => {
    const res = await request(makeApp()).post('/api/courses').send({});
  expect(mockCourseController.createCourse).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  test('GET /api/courses uses getCourses', async () => {
    const res = await request(makeApp()).get('/api/courses');
  expect(mockCourseController.getCourses).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /api/courses/:id uses authenticate then getCourseDetails', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/courses/abc');
  expect(mockAuthenticate).toHaveBeenCalled();
  expect(mockCourseController.getCourseDetails).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
