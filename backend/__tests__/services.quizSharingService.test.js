let mockApi;
let mockCache;

jest.mock('../src/services/quizApiClient', () => ({
  QuizApiClient: jest.fn().mockImplementation(() => mockApi)
}));

jest.mock('../src/services/quizCacheService', () => ({
  QuizCacheService: jest.fn().mockImplementation(() => mockCache)
}));

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    courseQuiz: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn()
    },
    course: {
      findFirst: jest.fn()
    }
  }
}));

describe('QuizSharingService', () => {
  let service;
  let QuizSharingService;
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    mockApi = {
      getQuiz: jest.fn(),
      createQuiz: jest.fn()
    };
    mockCache = {
      getCachedQuiz: jest.fn(),
      cacheQuizData: jest.fn()
    };
    ({ QuizSharingService } = require('../src/services/quizSharingService'));
    service = new QuizSharingService();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('shareQuizAsTemplate uses external data then creates template', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue({
      id: 'Q1',
      courseId: 'C1',
      title: 'Quiz',
      description: 'Desc',
      category: 'cat',
      difficulty: 'easy',
      tags: ['x'],
      externalQuizId: 'EXT',
      course: { title: 'Course', instructorId: 'I1' }
    });
    mockApi.getQuiz.mockResolvedValue({ data: { questions: [{ id: 'a' }], metadata: {} } });
    prisma.courseQuiz.create.mockResolvedValue({ id: 'T1', title: 'Quiz (Template)', createdAt: new Date().toISOString() });

    const res = await service.shareQuizAsTemplate('Q1', 'I1', { visibility: 'public' });
    expect(res.success).toBe(true);
    expect(res.template.title).toContain('Template');
    expect(prisma.courseQuiz.create).toHaveBeenCalled();
  });

  test('shareQuizAsTemplate falls back to cached data and errors if none', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue({
      id: 'Q1', courseId: 'C1', title: 'Quiz', description: 'D', category: 'c', difficulty: 'd', tags: [], externalQuizId: 'EXT', course: { title: 'T', instructorId: 'I1' }
    });
    mockApi.getQuiz.mockRejectedValue(new Error('down'));
    mockCache.getCachedQuiz.mockResolvedValue(null);
    await expect(service.shareQuizAsTemplate('Q1', 'I1')).rejects.toThrow('Quiz data not available for sharing');

    // When cache exists, it should proceed
    mockCache.getCachedQuiz.mockResolvedValue({ questions: [{ id: 'x' }], metadata: {} });
    const created = { id: 'T2', title: 'Quiz (Template)', createdAt: new Date().toISOString() };
    prisma.courseQuiz.create.mockResolvedValue(created);
    const res2 = await service.shareQuizAsTemplate('Q1', 'I1');
    expect(res2.success).toBe(true);
  });

  test('shareQuizAsTemplate throws when quiz not found or unauthorized', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue(null);
    await expect(service.shareQuizAsTemplate('NOPE', 'I1')).rejects.toThrow('Quiz not found or unauthorized');
  });

  test('getAvailableTemplates returns formatted templates with filters applied', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findMany.mockResolvedValue([
      { id: 'T1', title: 'A', description: 'd', category: 'cat', difficulty: 'easy', tags: ['t'], createdAt: 'now', sharedByUserId: 'I1', cachedData: { questions: [1,2], metadata: { originalCourse: 'OC', shareOptions: { allowModification: true, attribution: true } } } },
      { id: 'T2', title: 'B', description: 'e', category: 'cat', difficulty: 'hard', tags: [], createdAt: 'now', sharedByUserId: 'I2', cachedData: { questions: [], metadata: { originalCourse: 'OC2', shareOptions: {} } } }
    ]);
    const res = await service.getAvailableTemplates('I1', { category: 'cat', search: 'A' });
    expect(res.success).toBe(true);
    expect(res.templates[0]).toEqual(expect.objectContaining({ id: 'T1', questionCount: 2, isOwn: true }));
    expect(res.totalCount).toBe(2);
  });

  test('getAvailableTemplates honors difficulty filter and search', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findMany.mockResolvedValue([
      { id: 'T3', title: 'FindMe', description: 'zzz', category: 'cat', difficulty: 'medium', tags: [], createdAt: 'now', sharedByUserId: 'I9', cachedData: { questions: [1], metadata: { originalCourse: 'OC', shareOptions: { allowModification: false, attribution: false } } } }
    ]);
  const res = await service.getAvailableTemplates('I1', { difficulty: 'medium', search: 'find' });
  // When shareOptions explicitly set to false, flags should be false
  expect(res.templates[0]).toEqual(expect.objectContaining({ id: 'T3', allowModification: false, attribution: false }));
    expect(res.totalCount).toBe(1);
  });

  test('getAvailableTemplates includes templates shared with instructors visibility', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findMany.mockResolvedValue([
      { id: 'T4', title: 'Instr', description: 'only', category: 'cat', difficulty: 'hard', tags: [], createdAt: 'now', sharedByUserId: 'I9', cachedData: { questions: [1, 2, 3], metadata: { originalCourse: 'OC3', shareOptions: { visibility: 'instructors' } } } }
    ]);
    const res = await service.getAvailableTemplates('I1', { search: 'instr' });
    expect(res.success).toBe(true);
    expect(res.templates[0]).toEqual(expect.objectContaining({ id: 'T4', isOwn: false, allowModification: true, attribution: true }));
    expect(res.templates[0].questionCount).toBe(3);
  });

  test('copyTemplateToourse creates online and caches, or offline on API error', async () => {
    const { prisma } = require('../src/lib/prisma');
    // Happy path: online create
    prisma.course.findFirst.mockResolvedValue({ id: 'C2', instructorId: 'I1' });
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T1', isTemplate: true, isActive: true, title: 'TT (Template)', description: 'DD\n\n[Shared template]', category: 'cat', difficulty: 'easy', tags: ['template','shared'], cachedData: { questions: [{ id: 'q' }], settings: { timeLimit: 45 }, metadata: { shareOptions: { allowModification: true, attribution: true, visibility: 'public' } } }, sharedByUserId: 'I9' });
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'EXTNEW' } });
    prisma.courseQuiz.create.mockResolvedValueOnce({ id: 'QNEW', title: 'TT', description: 'DD', category: 'cat', difficulty: 'easy', createdAt: 'now' });
    const resOnline = await service.copyTemplateToourse('T1', 'C2', 'I1', {});
    expect(resOnline.mode).toBe('online');
    expect(mockCache.cacheQuizData).toHaveBeenCalledWith('QNEW', { quiz_id: 'EXTNEW' });

    // Offline fallback
    mockApi.createQuiz.mockRejectedValueOnce(new Error('down'));
    prisma.courseQuiz.create.mockResolvedValueOnce({ id: 'QOFF', title: 'TT', description: 'DD', category: 'cat', difficulty: 'easy', createdAt: 'now' });
    const resOffline = await service.copyTemplateToourse('T1', 'C2', 'I1', { title: 'Custom' });
    expect(resOffline.mode).toBe('offline');
    expect(resOffline.message).toMatch(/will sync/i);
  });

  test('copyTemplateToourse denies when instructor does not own target course', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue(null);
    await expect(service.copyTemplateToourse('T1', 'C2', 'I1', {})).rejects.toThrow('Target course not found or unauthorized');
  });

  test('copyTemplateToourse throws when template not found', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue({ id: 'C2', instructorId: 'I1' });
    prisma.courseQuiz.findFirst.mockResolvedValue(null);
    await expect(service.copyTemplateToourse('BAD', 'C2', 'I1', {})).rejects.toThrow('Template not found');
  });

  test('copyTemplateToourse denies when visibility is private and not owner', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue({ id: 'C2', instructorId: 'I1' });
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T1', isTemplate: true, isActive: true, title: 'TT (Template)', description: 'DD\n\n[Shared template]', category: 'cat', difficulty: 'easy', tags: [], cachedData: { questions: [], metadata: { shareOptions: { visibility: 'private' } } }, sharedByUserId: 'OTHER' });
    await expect(service.copyTemplateToourse('T1', 'C2', 'I1', {})).rejects.toThrow('Permission denied');
  });

  test('copyTemplateToourse keeps original questions when allowModification is false', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue({ id: 'C3', instructorId: 'I1' });
    // Template with 2 questions and allowModification set to false
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T3', isTemplate: true, isActive: true, title: 'TT (Template)', description: 'DD\n\n[Shared template]', category: 'cat', difficulty: 'easy', tags: ['template','shared'], cachedData: { questions: [{ id: 'q1' }, { id: 'q2' }], settings: { timeLimit: 30 }, metadata: { shareOptions: { allowModification: false, attribution: true, visibility: 'public' } } }, sharedByUserId: 'I9' });
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'EXTQ' } });
    prisma.courseQuiz.create.mockResolvedValueOnce({ id: 'QKEEP', title: 'TT', description: 'DD', category: 'cat', difficulty: 'easy', createdAt: 'now' });
    const res = await service.copyTemplateToourse('T3', 'C3', 'I1', { questions: [{ id: 'nx' }, { id: 'ny' }, { id: 'nz' }] });
    expect(res.mode).toBe('online');
    // Should keep original count (2), ignoring customization due to allowModification=false
    expect(res.quiz.questionCount).toBe(2);
  });

  test('copyTemplateToourse as owner sets sharedByUserId to null (no attribution)', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue({ id: 'C4', instructorId: 'I1' });
    // Template shared by same instructor
    const template = { id: 'TOWN', isTemplate: true, isActive: true, title: 'Own (Template)', description: 'Own\n\n[Shared template]', category: 'cat', difficulty: 'easy', tags: ['template','shared'], cachedData: { questions: [{ id: 'q1' }], settings: {}, metadata: { shareOptions: { visibility: 'public', attribution: true, allowModification: true } } }, sharedByUserId: 'I1' };
    prisma.courseQuiz.findFirst.mockResolvedValue(template);
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'EXT_OWN' } });
    const createSpy = prisma.courseQuiz.create;
    createSpy.mockResolvedValueOnce({ id: 'QOWN', title: 'Own', description: 'Own', category: 'cat', difficulty: 'easy', createdAt: 'now' });
    const res = await service.copyTemplateToourse('TOWN', 'C4', 'I1', {});
    expect(res.mode).toBe('online');
    // ensure sharedByUserId is null in data payload
    const call = createSpy.mock.calls[0][0];
    expect(call.data.sharedByUserId).toBeNull();
  });

  test('copyTemplateToourse uses custom questions when allowModification is true', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue({ id: 'C5', instructorId: 'I1' });
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T4', isTemplate: true, isActive: true, title: 'TT (Template)', description: 'DD\n\n[Shared template]', category: 'cat', difficulty: 'easy', tags: ['template','shared'], cachedData: { questions: [{ id: 'q1' }], settings: { timeLimit: 20 }, metadata: { shareOptions: { allowModification: true, visibility: 'public' } } }, sharedByUserId: 'I9' });
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'EXTC' } });
    prisma.courseQuiz.create.mockResolvedValueOnce({ id: 'QCUST', title: 'TT', description: 'DD', category: 'cat', difficulty: 'easy', createdAt: 'now' });
    const customQs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const res = await service.copyTemplateToourse('T4', 'C5', 'I1', { questions: customQs });
    expect(res.mode).toBe('online');
    expect(res.quiz.questionCount).toBe(4);
  });

  test('copyTemplateToourse does not log attribution when disabled', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.course.findFirst.mockResolvedValue({ id: 'C6', instructorId: 'I1' });
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T5', isTemplate: true, isActive: true, title: 'TT (Template)', description: 'DD\n\n[Shared template]', category: 'cat', difficulty: 'easy', tags: ['template','shared'], cachedData: { questions: [{ id: 'q1' }], settings: { timeLimit: 20 }, metadata: { shareOptions: { allowModification: true, visibility: 'public', attribution: false } } }, sharedByUserId: 'I9' });
    mockApi.createQuiz.mockResolvedValue({ data: { quiz_id: 'EXT_NO_ATTR' } });
    prisma.courseQuiz.create.mockResolvedValueOnce({ id: 'QNA', title: 'TT', description: 'DD', category: 'cat', difficulty: 'easy', createdAt: 'now' });
    console.log.mockClear();
    const res = await service.copyTemplateToourse('T5', 'C6', 'I1', {});
    expect(res.mode).toBe('online');
    // Should not log attribution message when attribution is false
    const logged = console.log.mock.calls.some(c => String(c[0]).includes('Template') && String(c[0]).includes('used by instructor'));
    expect(logged).toBe(false);
  });

  test('getTemplateDetails allows owner to view private template', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'TPRIV', isTemplate: true, isActive: true, title: 'P', description: 'D', category: 'cat', difficulty: 'hard', tags: [], createdAt: 'now', sharedByUserId: 'I1', cachedData: { questions: [{ id: 'q' }], metadata: { originalCourse: 'OC', shareOptions: { visibility: 'private', allowModification: false, attribution: false } } } });
    const res = await service.getTemplateDetails('TPRIV', 'I1');
    expect(res.success).toBe(true);
    expect(res.template.permissions.visibility).toBe('private');
    expect(res.template.isOwn).toBe(true);
  });

  test('getTemplateDetails enforces permissions and returns template info', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T1', isTemplate: true, isActive: true, title: 'TT', description: 'DD', category: 'cat', difficulty: 'easy', tags: [], createdAt: 'now', sharedByUserId: 'IX', cachedData: { questions: [{ id: 'x' }], metadata: { shareOptions: { visibility: 'public' }, estimatedTime: 10, originalCourse: 'OC' } } });
    const res = await service.getTemplateDetails('T1', 'I1');
    expect(res.template.permissions.visibility).toBe('public');

    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T2', isTemplate: true, isActive: true, sharedByUserId: 'I2', cachedData: { metadata: { shareOptions: { visibility: 'private' } } } });
    await expect(service.getTemplateDetails('T2', 'I1')).rejects.toThrow('Permission denied');
  });

  test('getTemplateDetails throws when template not found', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue(null);
    await expect(service.getTemplateDetails('MISS', 'I1')).rejects.toThrow('Template not found');
  });

  test('unshareTemplate requires ownership and soft-deletes', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue({ id: 'T1', sharedByUserId: 'I1', isTemplate: true });
    prisma.courseQuiz.update.mockResolvedValue({});
    const res = await service.unshareTemplate('T1', 'I1');
    expect(res.success).toBe(true);
    expect(prisma.courseQuiz.update).toHaveBeenCalledWith({ where: { id: 'T1' }, data: { isActive: false } });
  });

  test('unshareTemplate fails if not owner', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.findFirst.mockResolvedValue(null);
    await expect(service.unshareTemplate('T1', 'I1')).rejects.toThrow('Template not found or unauthorized');
  });

  test('getSharingStats aggregates counts and usage', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.groupBy.mockResolvedValue([{ _count: 3 }]);
    prisma.courseQuiz.findMany.mockResolvedValue([{ id: 'T1' }, { id: 'T2' }]);
    prisma.courseQuiz.count
      .mockResolvedValueOnce(2) // usage for T1
      .mockResolvedValueOnce(1) // usage for T2
      .mockResolvedValueOnce(5); // templates used by instructor
    const res = await service.getSharingStats('I1');
    expect(res.stats.templatesShared).toBe(3);
    expect(res.stats.timesUsed).toBe(3);
    expect(res.stats.templatesUsed).toBe(5);
  });

  test('getSharingStats returns zeros when there are no stats or templates', async () => {
    const { prisma } = require('../src/lib/prisma');
    prisma.courseQuiz.groupBy.mockResolvedValue([]);
    prisma.courseQuiz.findMany.mockResolvedValue([]);
    prisma.courseQuiz.count.mockResolvedValueOnce(0); // templatesUsed
    const res = await service.getSharingStats('I1');
    expect(res.success).toBe(true);
    expect(res.stats.templatesShared).toBe(0);
    expect(res.stats.timesUsed).toBe(0);
    expect(res.stats.templatesUsed).toBe(0);
  });
});
