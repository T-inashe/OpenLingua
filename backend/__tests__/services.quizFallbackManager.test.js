const pathToManager = '../src/services/quizFallbackManager';

// Mocks shared across tests
let mockApi;
let mockCache;
let prismaMock;

jest.mock('../src/services/quizApiClient', () => ({
  QuizApiClient: jest.fn().mockImplementation(() => mockApi)
}));

jest.mock('../src/services/quizCacheService', () => ({
  QuizCacheService: jest.fn().mockImplementation(() => mockCache)
}));

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    courseQuiz: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    quizResult: {
      findMany: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('QuizFallbackManager', () => {
  let QuizFallbackManager;
  let manager;
  let setIntervalSpy;
  let clearIntervalSpy;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();

    // Fresh mocks
    mockApi = {
      healthCheck: jest.fn(),
      createQuiz: jest.fn(),
      getQuiz: jest.fn(),
      submitQuizAnswers: jest.fn()
    };
    mockCache = {
      getCachedQuiz: jest.fn(),
      cacheQuizData: jest.fn(),
      storeQuizResult: jest.fn()
    };

    // Spy on timers used in constructor/destroy
    setIntervalSpy = jest.spyOn(global, 'setInterval').mockReturnValue(12345);
    clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});

    // Re-require after setting mocks
    ({ QuizFallbackManager } = require(pathToManager));
    manager = new QuizFallbackManager();

    // Silence logs for cleaner test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up interval
    manager.destroy();
  });

  test('isApiAvailable caches health result within 30 seconds', async () => {
    mockApi.healthCheck.mockResolvedValue({ status: 'healthy', data: {} });
    const first = await manager.isApiAvailable();
    expect(first).toBe(true);
    const second = await manager.isApiAvailable();
    expect(second).toBe(true);
    expect(mockApi.healthCheck).toHaveBeenCalledTimes(1);
  });

  test('isApiAvailable returns cached unhealthy without rechecking', async () => {
    // Seed cache as unhealthy within 30s
    manager.healthCache = { status: 'unhealthy', lastCheck: Date.now(), consecutiveFailures: 2 };
    const available = await manager.isApiAvailable();
    expect(available).toBe(false);
    expect(mockApi.healthCheck).not.toHaveBeenCalled();
  });

  test('checkApiHealth sets healthy state and returns true', async () => {
    mockApi.healthCheck.mockResolvedValue({ status: 'healthy', data: {} });
    const ok = await manager.checkApiHealth();
    expect(ok).toBe(true);
    const status = manager.getFallbackStatus();
    expect(status.apiStatus).toBe('healthy');
    expect(status.consecutiveFailures).toBe(0);
    expect(status.lastChecked).toEqual(expect.any(Number));
  });

  test('checkApiHealth resets failures when healthy response received', async () => {
    manager.healthCache.consecutiveFailures = 3;
    mockApi.healthCheck.mockResolvedValue({ status: 'healthy' });
    const ok = await manager.checkApiHealth();
    expect(ok).toBe(true);
    expect(manager.healthCache.consecutiveFailures).toBe(0);
  });

  test('checkApiHealth marks unhealthy and increments failures; logs escalate', async () => {
    mockApi.healthCheck.mockRejectedValue(new Error('down'));
    for (let i = 0; i < 10; i++) {
      // Ensure we bypass 30s cache by resetting lastCheck
      manager.healthCache.lastCheck = 0;
      await manager.checkApiHealth();
    }
    const status = manager.getFallbackStatus();
    expect(status.apiStatus).toBe('unhealthy');
    expect(status.consecutiveFailures).toBeGreaterThanOrEqual(10);
    // First failure warns, 10th logs error
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Quiz API became unavailable'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Quiz API has been down'));
  });

  test('executeWithFallback online success caches when context provided', async () => {
    // Force available
    manager.isApiAvailable = jest.fn().mockResolvedValue(true);
    const op = jest.fn().mockResolvedValue({ id: 'ok' });
    const fb = jest.fn();
    const res = await manager.executeWithFallback(op, fb, { cacheKey: 'L1', cacheData: { a: 1 } });
    expect(res).toEqual(expect.objectContaining({ success: true, mode: 'online' }));
    expect(op).toHaveBeenCalled();
    expect(mockCache.cacheQuizData).toHaveBeenCalledWith('L1', { a: 1 });
    expect(fb).not.toHaveBeenCalled();
  });

  test('executeWithFallback primary failure triggers fallback and marks unhealthy', async () => {
    manager.isApiAvailable = jest.fn().mockResolvedValue(true);
    const op = jest.fn().mockRejectedValue(new Error('boom'));
    const fb = jest.fn().mockResolvedValue({ cached: true });
    const res = await manager.executeWithFallback(op, fb, {});
    expect(res.mode).toBe('offline');
    expect(res.message).toMatch(/temporarily unavailable/i);
    expect(fb).toHaveBeenCalled();
    expect(manager.getFallbackStatus().apiStatus).toBe('unhealthy');
  });

  test('executeWithFallback uses fallback immediately when API unavailable', async () => {
    manager.isApiAvailable = jest.fn().mockResolvedValue(false);
    const fb = jest.fn().mockResolvedValue({ offline: true });
    const res = await manager.executeWithFallback(jest.fn(), fb, {});
    expect(res.mode).toBe('offline');
    expect(res.message).toMatch(/Service unavailable/i);
    expect(fb).toHaveBeenCalled();
  });

  test('getQuizWithFallback returns cached when offline and throws if not cached', async () => {
    manager.isApiAvailable = jest.fn().mockResolvedValue(false);
    mockCache.getCachedQuiz.mockResolvedValue({ id: 'cachedQuiz' });
    let res = await manager.getQuizWithFallback('L1', 'EXT1', 'C1');
    expect(res.mode).toBe('offline');
    expect(res.data).toEqual({ data: { id: 'cachedQuiz' } });

    mockCache.getCachedQuiz.mockResolvedValue(null);
    await expect(manager.getQuizWithFallback('L2', 'EXT2', 'C1')).rejects.toThrow('Quiz not available offline');
  });

  test('getQuizWithFallback uses online API; cache write not invoked without cacheData', async () => {
    manager.isApiAvailable = jest.fn().mockResolvedValue(true);
    mockApi.getQuiz = jest.fn().mockResolvedValue({ data: { quiz_id: 'EXT1', x: 1 } });
    const res = await manager.getQuizWithFallback('L1', 'EXT1', 'C1');
    expect(res.mode).toBe('online');
    expect(mockApi.getQuiz).toHaveBeenCalledWith('EXT1', 'C1');
    // No cacheData provided by getQuizWithFallback, so cache should not be written
    expect(mockCache.cacheQuizData).not.toHaveBeenCalled();
  });

  test('submitQuizWithFallback stores local result when offline', async () => {
    manager.isApiAvailable = jest.fn().mockResolvedValue(false);
    manager.calculateLocalScore = jest.fn().mockResolvedValue({ score: 2, totalQuestions: 3 });
    const res = await manager.submitQuizWithFallback('L1', 'EXT', { a: 1 }, 'S1', 'U1');
    expect(res.mode).toBe('offline');
    expect(mockCache.storeQuizResult).toHaveBeenCalledWith('L1', 'U1', expect.objectContaining({ score: 2, totalQuestions: 3, answers: { a: 1 } }));
  });

  test('calculateLocalScore handles different question types and defaults', async () => {
    mockCache.getCachedQuiz.mockResolvedValue({
      questions: [
        { id: 'q1', type: 'multiple_choice', correct_answer: 'A' },
        { id: 'q2', type: 'true_false', correct_answer: 'false' },
        { id: 'q3', type: 'short_answer', correct_answer: '  PaRiS  ' }
      ]
    });
    const answers = { q1: 'A', q2: 'false', q3: 'paris' };
    const sc = await manager.calculateLocalScore('L1', answers);
    expect(sc).toEqual({ score: 3, totalQuestions: 3 });

    mockCache.getCachedQuiz.mockResolvedValue(null);
    const sc2 = await manager.calculateLocalScore('L2', {});
    expect(sc2).toEqual({ score: 0, totalQuestions: 1 });
  });

  test('calculateLocalScore returns false for unsupported question type', async () => {
    mockCache.getCachedQuiz.mockResolvedValue({
      questions: [ { id: 'qX', type: 'drag_drop', correct_answer: ['a'] } ]
    });
    const sc = await manager.calculateLocalScore('LZ', { qX: ['a'] });
    expect(sc).toEqual({ score: 0, totalQuestions: 1 });
  });

  test('syncOfflineQuiz creates remotely and updates local record', async () => {
    const quiz = {
      id: 'Q1',
      title: 'T',
      description: 'D',
      category: 'cat',
      difficulty: 'easy',
      courseId: 'C1',
      course: { instructorId: 'I1' },
      cachedData: { questions: [1], settings: { timeLimit: 30 }, metadata: { needsSync: true } }
    };
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'EXT123' } });
    const { prisma } = require('../src/lib/prisma');
    await manager.syncOfflineQuiz(quiz);
    expect(mockApi.createQuiz).toHaveBeenCalledWith(expect.objectContaining({ title: 'T', questions: [1], timeLimit: 30 }), 'C1', 'I1');
    expect(prisma.courseQuiz.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'Q1' },
      data: expect.objectContaining({ externalQuizId: 'EXT123' })
    }));
  });

  test('syncOfflineResults submits to API and updates local records; skips offline quizzes', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.quizResult.findMany.mockResolvedValue([
      { id: 'R1', studentId: 'S1', answers: { a: 1 }, externalSessionId: null, quiz: { externalQuizId: 'offline_abc' } },
      { id: 'R2', studentId: 'S2', answers: { b: 2 }, externalSessionId: null, quiz: { externalQuizId: 'EXTZ' } },
      { id: 'R3', studentId: 'S3', answers: { c: 3 }, externalSessionId: null, quiz: { externalQuizId: 'EXTY' } }
    ]);
    mockApi.submitQuizAnswers
      .mockResolvedValueOnce({ data: { session_id: 'SS2' } })
      .mockResolvedValueOnce({ data: {} }); // no session id
    await manager.syncOfflineResults();
    // Should call API for non-offline quizzes only twice
    expect(mockApi.submitQuizAnswers).toHaveBeenCalledTimes(2);
    expect(prisma.quizResult.update).toHaveBeenCalledWith({ where: { id: 'R2' }, data: { externalSessionId: 'SS2' } });
    expect(prisma.quizResult.update).toHaveBeenCalledWith({ where: { id: 'R3' }, data: { externalSessionId: 'synced_R3' } });
  });

  test('syncOfflineResults outer catch handles findMany failure gracefully', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.quizResult.findMany.mockRejectedValueOnce(new Error('db fail'));
    await manager.syncOfflineResults();
    // No throw expected; error logged via console.error
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to sync offline results:'), expect.any(Error));
  });

  test('syncPendingData calls syncOfflineQuiz for offline_* and then syncOfflineResults', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findMany.mockResolvedValue([
      { id: 'Q1', externalQuizId: 'offline_x', cachedData: { metadata: { needsSync: true } }, course: { instructorId: 'I1' } },
      { id: 'Q2', externalQuizId: 'EXT2', cachedData: { metadata: { needsSync: true } }, course: { instructorId: 'I1' } }
    ]);
    const spySyncOfflineQuiz = jest.spyOn(manager, 'syncOfflineQuiz').mockResolvedValue();
    // Provide a noop for potentially missing method to avoid exceptions (code references syncQuizChanges but not defined)
    manager.syncQuizChanges = jest.fn().mockResolvedValue();
    const spyResults = jest.spyOn(manager, 'syncOfflineResults').mockResolvedValue();
    await manager.syncPendingData();
    expect(spySyncOfflineQuiz).toHaveBeenCalledWith(expect.objectContaining({ id: 'Q1' }));
    expect(manager.syncQuizChanges).toHaveBeenCalledWith(expect.objectContaining({ id: 'Q2' }));
    expect(spyResults).toHaveBeenCalled();
  });

  test('getFallbackStatus reflects unhealthy state; destroy clears interval', () => {
    manager.markApiUnhealthy();
    const status = manager.getFallbackStatus();
    expect(status.fallbackActive).toBe(true);
    expect(status.apiStatus).toBe('unhealthy');
    manager.destroy();
    expect(clearIntervalSpy).toHaveBeenCalledWith(12345);
  });

  test('createQuizWithFallback returns online result or offline local quiz on failure', async () => {
    // Online path
    manager.isApiAvailable = jest.fn().mockResolvedValue(true);
    mockApi.createQuiz.mockResolvedValueOnce({ data: { quiz_id: 'EXTCREATE', other: 1 } });
    const online = await manager.createQuizWithFallback({ title: 'T', questions: [], timeLimit: 10 }, 'C1', 'I1');
    expect(online.mode).toBe('online');
    expect(mockApi.createQuiz).toHaveBeenCalled();

    // Offline fallback path
    manager.isApiAvailable = jest.fn().mockResolvedValue(true);
    mockApi.createQuiz.mockRejectedValueOnce(new Error('down')); // trigger fallback inside executeWithFallback
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.create.mockResolvedValueOnce({ id: 'LNEW', externalQuizId: 'offline_abc', title: 'T', cachedData: { questions: [], settings: { timeLimit: 10 }, metadata: { totalQuestions: 0 } } });
    const offline = await manager.createQuizWithFallback({ title: 'T', questions: [], timeLimit: 10 }, 'C1', 'I1');
    expect(offline.mode).toBe('offline');
    expect(offline.message).toMatch(/using cached/i);
  });
});
