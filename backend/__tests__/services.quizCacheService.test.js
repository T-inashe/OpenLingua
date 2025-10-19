const { QuizCacheService } = require('../src/services/quizCacheService');

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    courseQuiz: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    quizResult: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  }
}));

const { prisma } = require('../src/lib/prisma');

describe('QuizCacheService', () => {
  let service;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuizCacheService();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('cacheQuizData', () => {
    test('updates courseQuiz with cached data and returns true', async () => {
      prisma.courseQuiz.update.mockResolvedValue({});
      const ok = await service.cacheQuizData('q1', {
        questions: [{ id: 1 }], time_limit: 30, allow_review: true, show_correct_answers: false,
        estimated_time: 15, passing_score: 60, version: '1.2'
      });
      expect(prisma.courseQuiz.update).toHaveBeenCalled();
      expect(ok).toBe(true);
    });

    test('returns false on error', async () => {
      prisma.courseQuiz.update.mockRejectedValue(new Error('db'));
      const ok = await service.cacheQuizData('q1', {});
      expect(ok).toBe(false);
    });
  });

  describe('getCachedQuiz', () => {
    test('returns null when not cached', async () => {
      prisma.courseQuiz.findUnique.mockResolvedValue({ isCached: false });
      const res = await service.getCachedQuiz('q1');
      expect(res).toBeNull();
    });

    test('returns formatted cached quiz data when cached', async () => {
      prisma.courseQuiz.findUnique.mockResolvedValue({
        isCached: true,
        cachedData: { metadata: { totalQuestions: 2 } },
        title: 'T', description: 'D', difficulty: 'easy', category: 'cat'
      });
      const res = await service.getCachedQuiz('q1');
      expect(res).toMatchObject({ title: 'T', description: 'D', difficulty: 'easy', category: 'cat', mode: 'offline' });
    });

    test('returns null on error', async () => {
      prisma.courseQuiz.findUnique.mockRejectedValue(new Error('db'));
      const res = await service.getCachedQuiz('q1');
      expect(res).toBeNull();
    });
  });

  describe('isCacheValid', () => {
    test('returns false when no quiz or no cachedAt', async () => {
      prisma.courseQuiz.findUnique.mockResolvedValue(null);
      const res = await service.isCacheValid('q1');
      expect(res).toBe(false);
    });

    test('returns true when within maxAge', async () => {
      const now = new Date();
      prisma.courseQuiz.findUnique.mockResolvedValue({
        isCached: true,
        cachedData: { cachedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString() }
      });
      const res = await service.isCacheValid('q1', 2);
      expect(res).toBe(true);
    });

    test('returns false on error', async () => {
      prisma.courseQuiz.findUnique.mockRejectedValue(new Error('db'));
      const res = await service.isCacheValid('q1');
      expect(res).toBe(false);
    });
  });

  describe('refreshCache', () => {
    test('returns true if newVersion <= currentVersion (no update)', async () => {
      prisma.courseQuiz.findUnique.mockResolvedValue({ cachedData: { version: '2.0' } });
      const ok = await service.refreshCache('q1', { version: '1.0' });
      expect(ok).toBe(true);
    });

    test('calls cacheQuizData when new version is higher', async () => {
      prisma.courseQuiz.findUnique.mockResolvedValue({ cachedData: { version: '1.0' } });
      const spy = jest.spyOn(QuizCacheService.prototype, 'cacheQuizData').mockResolvedValue(true);
      const ok = await service.refreshCache('q1', { version: '2.0' });
      expect(spy).toHaveBeenCalledWith('q1', { version: '2.0' });
      expect(ok).toBe(true);
      spy.mockRestore();
    });

    test('returns false on error', async () => {
      prisma.courseQuiz.findUnique.mockRejectedValue(new Error('db'));
      const ok = await service.refreshCache('q1', { version: '2.0' });
      expect(ok).toBe(false);
    });
  });

  describe('getCachedQuizzesForCourse', () => {
    test('returns mapped quizzes', async () => {
      prisma.courseQuiz.findMany.mockResolvedValue([{
        id: 'q1', title: 'T', description: 'D', difficulty: 'easy', category: 'cat',
        cachedData: { metadata: { totalQuestions: 3, estimatedTime: 10 } }, createdAt: '2025-01-01'
      }]);
      const res = await service.getCachedQuizzesForCourse('c1');
      expect(res[0]).toMatchObject({ id: 'q1', title: 'T', difficulty: 'easy', questionCount: 3, estimatedTime: 10, mode: 'offline' });
    });

    test('returns empty list on error', async () => {
      prisma.courseQuiz.findMany.mockRejectedValue(new Error('db'));
      const res = await service.getCachedQuizzesForCourse('c1');
      expect(res).toEqual([]);
    });
  });

  describe('cleanupOldCache', () => {
    test('updates old cache entries and returns count', async () => {
      prisma.courseQuiz.updateMany.mockResolvedValue({ count: 2 });
      const count = await service.cleanupOldCache(1);
      expect(typeof count).toBe('number');
      expect(count).toBe(2);
    });

    test('returns 0 on error', async () => {
      prisma.courseQuiz.updateMany.mockRejectedValue(new Error('db'));
      const count = await service.cleanupOldCache(1);
      expect(count).toBe(0);
    });
  });

  describe('storeQuizResult', () => {
    test('upserts and returns result', async () => {
      const fake = { id: 'r1' };
      prisma.quizResult.upsert.mockResolvedValue(fake);
      const res = await service.storeQuizResult('q1', 's1', { score: 90, totalQuestions: 10, timeSpent: 50, answers: {} }, 'ext');
      expect(prisma.quizResult.upsert).toHaveBeenCalled();
      expect(res).toBe(fake);
    });

    test('returns null on error', async () => {
      prisma.quizResult.upsert.mockRejectedValue(new Error('db'));
      const res = await service.storeQuizResult('q1', 's1', { score: 90, totalQuestions: 10, timeSpent: 50, answers: {} }, 'ext');
      expect(res).toBeNull();
    });
  });

  describe('getQuizResults', () => {
    test('returns results with student included', async () => {
      prisma.quizResult.findMany.mockResolvedValue([{ id: 'r1', student: { id: 's1' } }]);
      const res = await service.getQuizResults('q1');
      expect(prisma.quizResult.findMany).toHaveBeenCalledWith({
        where: { quizId: 'q1' },
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { completedAt: 'desc' }
      });
      expect(res[0].id).toBe('r1');
    });

    test('filters by studentId when provided', async () => {
      prisma.quizResult.findMany.mockResolvedValue([]);
      await service.getQuizResults('q1', 's1');
      expect(prisma.quizResult.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { quizId: 'q1', studentId: 's1' } }));
    });

    test('returns [] on error', async () => {
      prisma.quizResult.findMany.mockRejectedValue(new Error('db'));
      const res = await service.getQuizResults('q1');
      expect(res).toEqual([]);
    });
  });
});
