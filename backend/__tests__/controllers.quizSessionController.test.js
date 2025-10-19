const buildRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((data) => {
    res.body = data;
    return res;
  });
  return res;
};

describe('QuizSessionController', () => {
  let mockPrisma;
  let mockApi;
  let mockCache;

  const quizId = 'quiz_1';
  const courseId = 'course_1';
  const instructorId = 'inst_1';
  const studentId = 'stud_1';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockApi = {
      startQuizSession: jest.fn(),
      submitQuizAnswers: jest.fn(),
    };
    mockCache = {
      cacheQuizData: jest.fn(),
      getCachedQuiz: jest.fn(),
      storeQuizResult: jest.fn(),
      getQuizResults: jest.fn(),
    };
    mockPrisma = {
      courseQuiz: {
        findFirst: jest.fn(),
      },
      quizResult: {
        findFirst: jest.fn(),
      },
    };

    jest.mock('../src/services/quizApiClient', () => ({
      QuizApiClient: jest.fn().mockImplementation(() => mockApi),
    }));
    jest.mock('../src/services/quizCacheService', () => ({
      QuizCacheService: jest.fn().mockImplementation(() => mockCache),
    }));
    jest.mock('../src/lib/prisma', () => ({ prisma: mockPrisma }));
  });

  const loadController = () => require('../src/controllers/quizSessionController').QuizSessionController;

  test('startQuizSession - access denied when quiz not found', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue(null);

    await controller.startQuizSession(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toMatch(/access denied/i);
  });

  test('startQuizSession - conflict when already completed', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, externalQuizId: 'ext_1', title: 'T', description: '', course: { id: courseId, title: 'C' } });
    mockPrisma.quizResult.findFirst.mockResolvedValue({ score: 3, completedAt: 'now' });

    await controller.startQuizSession(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.body.error).toMatch(/already completed/);
  });

  test('startQuizSession - online success with cached quiz', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, externalQuizId: 'ext_1', title: 'T', description: 'D', course: { id: courseId, title: 'C' } });
    mockPrisma.quizResult.findFirst.mockResolvedValue(null);
    mockApi.startQuizSession.mockResolvedValue({ data: { session_id: 'sess_1', quiz: { questions: [{}, {}] }, time_limit: 45 } });

    await controller.startQuizSession(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session.mode).toBe('online');
    expect(res.body.session.quiz.totalQuestions).toBe(2);
    expect(mockCache.cacheQuizData).toHaveBeenCalledWith(quizId, { questions: [{}, {}] });
  });

  test('startQuizSession - offline fallback with cached data when API fails', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, externalQuizId: 'ext_1', title: 'T', description: 'D', course: { id: courseId, title: 'C' } });
    mockPrisma.quizResult.findFirst.mockResolvedValue(null);
    mockApi.startQuizSession.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue({ questions: [{}, {}, {}], settings: { timeLimit: 30 } });

    await controller.startQuizSession(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.session.mode).toBe('offline');
    expect(res.body.session.quiz.totalQuestions).toBe(3);
  });

  test('startQuizSession - 503 when no cached data and API fails', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, externalQuizId: 'ext_1', title: 'T', description: 'D', course: { id: courseId, title: 'C' } });
    mockPrisma.quizResult.findFirst.mockResolvedValue(null);
    mockApi.startQuizSession.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue(null);

    await controller.startQuizSession(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.error).toMatch(/unavailable/);
  });

  test('submitQuizAnswers - online submission uses external result when not offline', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId }, body: { sessionId: 'sess_1', answers: { q1: 'a' }, timeSpent: 12 } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, isActive: true, externalQuizId: 'ext_1' });
    mockApi.submitQuizAnswers.mockResolvedValue({ data: { score: 2, total_questions: 3 } });
    // cached quiz for local scoring fallback; shouldn't be needed but method calculates anyway
    mockCache.getCachedQuiz.mockResolvedValue({ questions: [{ id: 'q1', type: 'short_answer', correct_answer: 'a' }, { id: 'q2', type: 'true_false', correct_answer: true }, { id: 'q3', type: 'multiple_choice', correct_answer: 'x' }] });
    mockCache.storeQuizResult.mockResolvedValue({});

    await controller.submitQuizAnswers(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.result.mode).toBe('online');
    expect(res.body.result.totalQuestions).toBe(3);
    expect(mockCache.storeQuizResult).toHaveBeenCalled();
  });

  test('submitQuizAnswers - offline session skips external and stores locally', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId }, body: { sessionId: 'offline_x', answers: { q1: true }, timeSpent: 5 } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, isActive: true, externalQuizId: 'ext_1' });
    mockCache.getCachedQuiz.mockResolvedValue({ questions: [{ id: 'q1', type: 'true_false', correct_answer: true }] });
    mockCache.storeQuizResult.mockResolvedValue({});

    await controller.submitQuizAnswers(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.result.mode).toBe('offline');
    expect(res.body.result.score).toBe(1);
  });

  test('submitQuizAnswers - external API failure falls back to local scoring', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId }, body: { sessionId: 'sess_1', answers: { q1: 'x' }, timeSpent: 7 } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, isActive: true, externalQuizId: 'ext_1' });
    mockApi.submitQuizAnswers.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue({ questions: [{ id: 'q1', type: 'multiple_choice', correct_answer: 'x' }] });
    mockCache.storeQuizResult.mockResolvedValue({});

    await controller.submitQuizAnswers(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.result.mode).toBe('offline');
    expect(res.body.result.score).toBe(1);
  });

  test('submitQuizAnswers - 400 when no answers provided', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId }, body: { sessionId: 'sess_1', answers: {} } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, courseId, isActive: true, externalQuizId: 'ext_1' });

    await controller.submitQuizAnswers(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getQuizResults - student sees own result fields limited', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: studentId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, course: { instructorId: instructorId } });
    mockCache.getQuizResults.mockResolvedValue([
      { studentId, student: { name: 'Alice', email: 'a@example.com' }, score: 3, totalQuestions: 5, timeSpent: 10, completedAt: 'now', externalSessionId: 'sess' },
    ]);

    await controller.getQuizResults(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].studentEmail).toBeUndefined();
    expect(res.body.summary.totalAttempts).toBe(1);
  });

  test('getQuizResults - instructor sees all results with emails', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { quizId }, user: { id: instructorId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: quizId, course: { instructorId } });
    mockCache.getQuizResults.mockResolvedValue([
      { studentId: 's1', student: { name: 'Bob', email: 'b@example.com' }, score: 4, totalQuestions: 5, timeSpent: 9, completedAt: 'now', externalSessionId: null },
      { studentId: 's2', student: { name: 'Eve', email: 'e@example.com' }, score: 2, totalQuestions: 5, timeSpent: 12, completedAt: 'now', externalSessionId: 'sess' },
    ]);

    await controller.getQuizResults(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].studentEmail).toBe('b@example.com');
    expect(res.body.summary.totalAttempts).toBe(2);
    expect(Math.round(res.body.summary.averageScore)).toBe(3);
    expect(Math.round(res.body.summary.passRate)).toBe(50);
  });
});
