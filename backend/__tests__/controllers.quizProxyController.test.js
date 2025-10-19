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

describe('QuizProxyController', () => {
  let mockPrisma;
  let mockApi;
  let mockCache;

  const mockQuizId = 'quiz_1';
  const mockCourseId = 'course_1';
  const mockInstructorId = 'user_1';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockApi = {
      withRetry: jest.fn(),
      createQuiz: jest.fn(),
      getQuiz: jest.fn(),
      updateQuiz: jest.fn(),
      deleteQuiz: jest.fn(),
      healthCheck: jest.fn(),
    };
    mockCache = {
      cacheQuizData: jest.fn(),
      refreshCache: jest.fn(),
      getCachedQuiz: jest.fn(),
      getCachedQuizzesForCourse: jest.fn(),
    };
    mockPrisma = {
      course: {
        findFirst: jest.fn(),
      },
      courseQuiz: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
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

  const loadController = () => require('../src/controllers/quizProxyController').QuizProxyController;

  test('createCourseQuiz - online success', async () => {
    const { QuizProxyController } = require('../src/controllers/quizProxyController');
    const controller = new QuizProxyController();
    const req = {
      params: { courseId: mockCourseId },
      user: { id: mockInstructorId },
      body: {
        title: 'New Quiz',
        questions: [{ id: 'q1' }],
        description: 'desc',
        category: 'cat',
        difficulty: 'easy',
      },
    };
    const res = buildRes();

    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId, instructorId: mockInstructorId });
    mockApi.withRetry.mockImplementation((fn) => fn());
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'ext_123' } });
    const createdLocal = { id: mockQuizId, externalQuizId: 'ext_123', title: 'New Quiz', description: 'desc', category: 'cat', difficulty: 'easy', createdAt: '2024-01-01T00:00:00.000Z' };
    mockPrisma.courseQuiz.create.mockResolvedValue(createdLocal);

    await controller.createCourseQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockApi.createQuiz).toHaveBeenCalled();
    expect(mockPrisma.courseQuiz.create).toHaveBeenCalled();
    expect(mockCache.cacheQuizData).toHaveBeenCalledWith(createdLocal.id, { quiz_id: 'ext_123' });
    expect(res.body.success).toBe(true);
    expect(res.body.quiz.id).toBe(mockQuizId);
    expect(res.body.quiz.externalId).toBe('ext_123');
  });

  test('createCourseQuiz - offline fallback when API fails', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = {
      params: { courseId: mockCourseId },
      user: { id: mockInstructorId },
      body: { title: 'Q', questions: [{ id: 'q' }], timeLimit: 20 },
    };
    const res = buildRes();

    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId, instructorId: mockInstructorId });
    mockApi.withRetry.mockRejectedValue(new Error('down'));
    const fallback = { id: 'local_off', title: 'Q', description: '', category: 'general', difficulty: 'beginner', createdAt: 'now' };
    mockPrisma.courseQuiz.create.mockResolvedValue(fallback);

    await controller.createCourseQuiz(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.mode).toBe('offline');
    expect(res.body.success).toBe(true);
    expect(res.body.quiz.id).toBe('local_off');
    expect(mockCache.cacheQuizData).not.toHaveBeenCalled();
  });

  test('getCourseQuizzes - access denied', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId }, user: { id: 'user_x' } };
    const res = buildRes();
    mockPrisma.course.findFirst.mockResolvedValue(null);

    await controller.getCourseQuizzes(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toMatch(/Access denied/);
  });

  test('getCourseQuizzes - online enrich with external data', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId }, user: { id: mockInstructorId } };
    const res = buildRes();
    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId });
    mockPrisma.courseQuiz.findMany.mockResolvedValue([
      { id: mockQuizId, courseId: mockCourseId, externalQuizId: 'ext_1', title: 'T', description: '', category: 'c', difficulty: 'd', tags: [], createdAt: 'now' },
    ]);
    mockApi.getQuiz.mockResolvedValue({ data: { questions: [{}, {}] } });

    await controller.getCourseQuizzes(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.quizzes).toHaveLength(1);
    expect(res.body.quizzes[0].mode).toBe('online');
    expect(res.body.quizzes[0].questionCount).toBe(2);
    expect(mockCache.refreshCache).toHaveBeenCalledWith(mockQuizId, { questions: [{}, {}] });
  });

  test('getCourseQuizzes - per-quiz fallback to cached data on API error', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId }, user: { id: mockInstructorId } };
    const res = buildRes();
    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId });
    mockPrisma.courseQuiz.findMany.mockResolvedValue([
      { id: mockQuizId, courseId: mockCourseId, externalQuizId: 'ext_1', title: 'T', description: '', category: 'c', difficulty: 'd', tags: [], createdAt: 'now' },
    ]);
    mockApi.getQuiz.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue({ metadata: { totalQuestions: 5 } });

    await controller.getCourseQuizzes(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.quizzes[0].mode).toBe('offline');
    expect(res.body.quizzes[0].questionCount).toBe(5);
  });

  test('getQuizDetails - online success and cache refresh', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId, quizId: mockQuizId }, user: { id: mockInstructorId } };
    const res = buildRes();
    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId });
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: mockQuizId, courseId: mockCourseId, externalQuizId: 'ext_1' });
    mockApi.getQuiz.mockResolvedValue({ data: { title: 'X', questions: [{}] } });

    await controller.getQuizDetails(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('online');
    expect(res.body.id).toBe(mockQuizId);
    expect(mockCache.refreshCache).toHaveBeenCalledWith(mockQuizId, { title: 'X', questions: [{}] });
  });

  test('getQuizDetails - offline fallback with cached data', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId, quizId: mockQuizId }, user: { id: mockInstructorId } };
    const res = buildRes();
    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId });
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: mockQuizId, courseId: mockCourseId, externalQuizId: 'ext_1' });
    mockApi.getQuiz.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue({ title: 'Cached', questions: [{}, {}] });

    await controller.getQuizDetails(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('offline');
    expect(res.body.title).toBe('Cached');
  });

  test('getQuizDetails - 503 when no cached data', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId, quizId: mockQuizId }, user: { id: mockInstructorId } };
    const res = buildRes();
    mockPrisma.course.findFirst.mockResolvedValue({ id: mockCourseId });
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: mockQuizId, courseId: mockCourseId, externalQuizId: 'ext_1' });
    mockApi.getQuiz.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue(null);

    await controller.getQuizDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.error).toMatch(/Quiz unavailable/);
  });

  test('updateQuiz - online success updates local and cache', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId, quizId: mockQuizId }, user: { id: mockInstructorId }, body: { title: 'New' } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: mockQuizId, course: { id: mockCourseId, instructorId: mockInstructorId }, externalQuizId: 'ext_1', title: 'Old', description: '', category: 'c', difficulty: 'd', tags: [] });
    mockApi.updateQuiz.mockResolvedValue({ data: { ok: true } });
    const updated = { id: mockQuizId, title: 'New' };
    mockPrisma.courseQuiz.update.mockResolvedValue(updated);

    await controller.updateQuiz(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('online');
    expect(res.body.quiz).toEqual(updated);
    expect(mockCache.cacheQuizData).toHaveBeenCalledWith(mockQuizId, { ok: true });
  });

  test('updateQuiz - offline local update with needsSync', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId, quizId: mockQuizId }, user: { id: mockInstructorId }, body: { title: 'New' } };
    const res = buildRes();
    const quiz = { id: mockQuizId, course: { id: mockCourseId, instructorId: mockInstructorId }, externalQuizId: 'ext_1', title: 'Old', description: '', category: 'c', difficulty: 'd', tags: [], cachedData: {} };
    mockPrisma.courseQuiz.findFirst.mockResolvedValue(quiz);
    mockApi.updateQuiz.mockRejectedValue(new Error('down'));
    mockPrisma.courseQuiz.update.mockResolvedValue({ id: mockQuizId, title: 'New' });

    await controller.updateQuiz(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('offline');
    expect(res.body.message).toMatch(/Updated locally/);
    expect(mockPrisma.courseQuiz.update).toHaveBeenCalled();
  });

  test('deleteQuiz - soft delete locally even if external fails', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = { params: { courseId: mockCourseId, quizId: mockQuizId }, user: { id: mockInstructorId } };
    const res = buildRes();
    mockPrisma.courseQuiz.findFirst.mockResolvedValue({ id: mockQuizId, course: { id: mockCourseId, instructorId: mockInstructorId }, externalQuizId: 'ext_1' });
    mockApi.deleteQuiz.mockRejectedValue(new Error('down'));
    mockPrisma.courseQuiz.update.mockResolvedValue({ id: mockQuizId, isActive: false });

    await controller.deleteQuiz(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.courseQuiz.update).toHaveBeenCalledWith({ where: { id: mockQuizId }, data: { isActive: false, cachedData: null, isCached: false } });
  });

  test('checkApiHealth - healthy', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = {}; const res = buildRes();
    mockApi.healthCheck.mockResolvedValue({ status: 'ok' });

    await controller.checkApiHealth(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('checkApiHealth - unhealthy returns 503', async () => {
    const Controller = loadController();
    const controller = new Controller();
    const req = {}; const res = buildRes();
    mockApi.healthCheck.mockRejectedValue(new Error('down'));

    await controller.checkApiHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.status).toBe('unhealthy');
  });
});
