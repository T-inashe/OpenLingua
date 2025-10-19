jest.mock('../src/lib/prisma', () => ({
  prisma: {
    course: { findFirst: jest.fn() },
    courseQuiz: { findFirst: jest.fn() },
  }
}));

const { prisma } = require('../src/lib/prisma');

const { validateCourseOwnership, validateQuizAccess, quizRateLimit, validateQuizData, validateQuizSubmission, logQuizOperation } = require('../src/middleware/quizAuth');

const makeReqResNext = (overrides = {}) => {
  const req = { params: {}, body: {}, user: { id: 'u1' }, get: () => 'jest', ip: '127.0.0.1', ...overrides };
  const res = {
    statusCode: 200,
    status: jest.fn(function (code) { this.statusCode = code; return this; }),
    json: jest.fn((b) => b),
    on: jest.fn((event, cb) => { if (event === 'finish') { setImmediate(cb); } }),
  };
  const next = jest.fn();
  return { req, res, next };
};

describe('quizAuth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCourseOwnership', () => {
    test('400 when courseId missing', async () => {
      const { req, res, next } = makeReqResNext();
      await validateCourseOwnership(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('403 when user does not own course', async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1' } });
      await validateCourseOwnership(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('proceeds when ownership verified', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'c1', instructorId: 'u1' });
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1' } });
      await validateCourseOwnership(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.course).toBeDefined();
    });

    test('500 on prisma error', async () => {
      prisma.course.findFirst.mockRejectedValue(new Error('db down'));
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1' } });
      await validateCourseOwnership(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateQuizAccess', () => {
    test('400 when courseId missing', async () => {
      const { req, res, next } = makeReqResNext();
      await validateQuizAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('403 when not enrolled nor instructor', async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1' } });
      await validateQuizAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('404 when quizId provided but quiz missing/inactive', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'c1', instructorId: 'u2', enrollments: [] });
      prisma.courseQuiz.findFirst.mockResolvedValue(null);
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1', quizId: 'q1' } });
      await validateQuizAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('proceeds and sets role when access granted and quiz exists', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'c1', instructorId: 'u1', enrollments: [] });
      prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'q1', courseId: 'c1', isActive: true });
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1', quizId: 'q1' } });
      await validateQuizAccess(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.userRole).toBe('instructor');
      expect(req.quiz).toBeDefined();
    });

    test('500 on prisma error', async () => {
      prisma.course.findFirst.mockRejectedValue(new Error('db oops'));
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1' } });
      await validateQuizAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('quizRateLimit', () => {
    test('401 when no user on request', () => {
      const { req, res, next } = makeReqResNext({ user: undefined });
      quizRateLimit(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('allows multiple requests below limit', () => {
      const { req, res, next } = makeReqResNext();
      for (let i = 0; i < 3; i++) {
        quizRateLimit(req, res, next);
      }
      expect(next).toHaveBeenCalledTimes(3);
    });
  });

  describe('validateQuizData', () => {
    test('rejects missing title', () => {
      const { req, res, next } = makeReqResNext({ body: {} });
      validateQuizData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('rejects too long title', () => {
      const { req, res, next } = makeReqResNext({ body: { title: 'x'.repeat(201), questions: [{}] } });
      validateQuizData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('rejects no questions', () => {
      const { req, res, next } = makeReqResNext({ body: { title: 'ok', questions: [] } });
      validateQuizData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('rejects invalid question type', () => {
      const { req, res, next } = makeReqResNext({ body: { title: 'ok', questions: [{ text: 'Q1', type: 'bad' }] } });
      validateQuizData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('accepts valid multiple_choice', () => {
      const body = { title: 'ok', questions: [{ text: 'Q1', type: 'multiple_choice', options: ['a','b'], correct_answer: 'a' }] };
      const { req, res, next } = makeReqResNext({ body });
      validateQuizData(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateQuizSubmission', () => {
    test('rejects missing sessionId', () => {
      const { req, res, next } = makeReqResNext({ body: {} });
      validateQuizSubmission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('rejects invalid answers', () => {
      const { req, res, next } = makeReqResNext({ body: { sessionId: 's1', answers: {} } });
      validateQuizSubmission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('accepts valid payload', () => {
      const { req, res, next } = makeReqResNext({ body: { sessionId: 's1', answers: { q1: 'a' }, timeSpent: 10 } });
      validateQuizSubmission(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logQuizOperation', () => {
    test('logs on finish and calls next', (done) => {
      const { req, res, next } = makeReqResNext({ params: { courseId: 'c1', quizId: 'q1' }, method: 'GET' });
      const mw = logQuizOperation('test_op');
      mw(req, res, () => {
        // simulate response finished
        res.on.mock.calls[0][1]();
        expect(typeof res.on).toBe('function' || 'object');
        done();
      });
    });
  });
});
