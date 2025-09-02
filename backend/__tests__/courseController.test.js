const controller = require('../src/controllers/courseController');
const { prisma } = require('../src/lib/prisma');

jest.mock('../src/lib/prisma', () => ({ prisma: {
  course: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  word: { create: jest.fn() },
  courseEnrollment: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
  userCourse: { deleteMany: jest.fn() },
  forumPost: { findMany: jest.fn() },
  courseReview: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
} }));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('courseController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = undefined;
  });

  describe('translateText', () => {
    test('400 when missing required fields', async () => {
      const req = { body: {} };
      const res = mockRes();
      await controller.translateText(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields: q, source, target' });
    });

    test('returns translated text on success', async () => {
      const req = { body: { q: 'Hello', source: 'en', target: 'es' } };
      const res = mockRes();
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: { translations: [{ translatedText: 'Hola' }] } })
      });

      await controller.translateText(req, res);

      expect(global.fetch).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ translatedText: 'Hola' });
    });

    test('handles API error gracefully', async () => {
      const req = { body: { q: 'Hello', source: 'en', target: 'es' } };
      const res = mockRes();
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ error: { message: 'bad' } })
      });

      await controller.translateText(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Translation service failed' });
    });
  });

  describe('createCourse', () => {
    test('creates course and words then returns 201', async () => {
      const req = { body: {
        title: 'Course', description: 'Desc', language: 'en', level: 'A1', category: 'cat', hours: 5,
        public: true, community: true, discussions: true, info: 'i', instructorId: 'u1',
        words: [{ title: 'w1', type: 'n', duration: 1, content: 'c1' }]
      } };
      const res = mockRes();
      prisma.course.create.mockResolvedValue({ id: 'c1' });
      prisma.word.create.mockResolvedValue({});

      await controller.createCourse(req, res);

      expect(prisma.course.create).toHaveBeenCalled();
      expect(prisma.word.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Course created successfully' });
    });
  });

  describe('getCourses', () => {
    test('returns list of courses', async () => {
      const req = {};
      const res = mockRes();
      prisma.course.findMany.mockResolvedValue([{ id: 'c1' }]);
      await controller.getCourses(req, res);
      expect(res.json).toHaveBeenCalledWith({ courses: [{ id: 'c1' }] });
    });
    test('handles error fetching courses', async () => {
      const req = {};
      const res = mockRes();
      prisma.course.findMany.mockRejectedValue(new Error('db'));
      await controller.getCourses(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching courses' });
    });
  });

  describe('getCourseDetails', () => {
    test('404 when not found', async () => {
      const req = { params: { courseId: 'missing' } };
      const res = mockRes();
      prisma.course.findUnique.mockResolvedValue(null);
      await controller.getCourseDetails(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Course not found' });
    });
    test('returns course when found', async () => {
      const req = { params: { courseId: 'c1' } };
      const res = mockRes();
      prisma.course.findUnique.mockResolvedValue({ id: 'c1' });
      await controller.getCourseDetails(req, res);
      expect(res.json).toHaveBeenCalledWith({ course: { id: 'c1' } });
    });
    test('handles error', async () => {
      const req = { params: { courseId: 'c1' } };
      const res = mockRes();
      prisma.course.findUnique.mockRejectedValue(new Error('db'));
      await controller.getCourseDetails(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching course details' });
    });
  });

  describe('join/leave course', () => {
    test('joinCourse creates enrollment', async () => {
      const req = { body: { courseId: 'c1', userId: 'u1' } };
      const res = mockRes();
      prisma.courseEnrollment.create.mockResolvedValue({});
      await controller.joinCourse(req, res);
      expect(prisma.courseEnrollment.create).toHaveBeenCalledWith({ data: { userId: 'u1', courseId: 'c1', progress: '0%' } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Joined course successfully' });
    });

    test('leaveCourse deletes userCourse rows', async () => {
      const req = { params: { courseId: '5' }, user: { userId: 'u1' } };
      const res = mockRes();
      prisma.userCourse.deleteMany.mockResolvedValue({});
      await controller.leaveCourse(req, res);
      expect(prisma.userCourse.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', courseId: 5 } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Left course successfully' });
    });
    test('joinCourse handles error', async () => {
      const req = { body: { courseId: 'c1', userId: 'u1' } };
      const res = mockRes();
      prisma.courseEnrollment.create.mockRejectedValue(new Error('db'));
      await controller.joinCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Could not join course' });
    });
    test('leaveCourse handles error', async () => {
      const req = { params: { courseId: '5' }, user: { userId: 'u1' } };
      const res = mockRes();
      prisma.userCourse.deleteMany.mockRejectedValue(new Error('db'));
      await controller.leaveCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Could not leave course' });
    });
  });

  describe('user-centric queries', () => {
    test('getCoursesByUserId returns courses', async () => {
      const req = { params: { userId: 'u1' } };
      const res = mockRes();
      prisma.course.findMany.mockResolvedValue([{ id: 'c1' }]);
      await controller.getCoursesByUserId(req, res);
      expect(res.json).toHaveBeenCalledWith({ courses: [{ id: 'c1' }] });
    });
    test('getCoursesByUserId handles error', async () => {
      const req = { params: { userId: 'u1' } };
      const res = mockRes();
      prisma.course.findMany.mockRejectedValue(new Error('db'));
      await controller.getCoursesByUserId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Error fetching user's courses" });
    });

    test('getJoinedCoursesByUserId returns flattened courses', async () => {
      const req = { params: { userId: 'u1' } };
      const res = mockRes();
      prisma.courseEnrollment.findMany.mockResolvedValue([{ course: { id: 'c1' } }]);
      await controller.getJoinedCoursesByUserId(req, res);
      expect(res.json).toHaveBeenCalledWith({ courses: [{ id: 'c1' }] });
    });
    test('getJoinedCoursesByUserId handles error', async () => {
      const req = { params: { userId: 'u1' } };
      const res = mockRes();
      prisma.courseEnrollment.findMany.mockRejectedValue(new Error('db'));
      await controller.getJoinedCoursesByUserId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching joined courses' });
    });

    test('getJoinedCoursesByUserIdAndCourseId returns null when not joined', async () => {
      const req = { params: { userId: 'u1', courseId: 'c1' } };
      const res = mockRes();
      prisma.courseEnrollment.findFirst.mockResolvedValue(null);
      await controller.getJoinedCoursesByUserIdAndCourseId(req, res);
      expect(res.json).toHaveBeenCalledWith({ joined: null });
    });
    test('getJoinedCoursesByUserIdAndCourseId returns record when joined', async () => {
      const req = { params: { userId: 'u1', courseId: 'c1' } };
      const res = mockRes();
      prisma.courseEnrollment.findFirst.mockResolvedValue({ id: 'e1' });
      await controller.getJoinedCoursesByUserIdAndCourseId(req, res);
      expect(res.json).toHaveBeenCalledWith({ joined: { id: 'e1' } });
    });
    test('getJoinedCoursesByUserIdAndCourseId handles error', async () => {
      const req = { params: { userId: 'u1', courseId: 'c1' } };
      const res = mockRes();
      prisma.courseEnrollment.findFirst.mockRejectedValue(new Error('db'));
      await controller.getJoinedCoursesByUserIdAndCourseId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching joined course' });
    });

    test('getJoinedCoursesByCourseId returns enrollments', async () => {
      const req = { params: { courseId: 'c1' } };
      const res = mockRes();
      prisma.courseEnrollment.findMany.mockResolvedValue([{ id: 'e1' }]);
      await controller.getJoinedCoursesByCourseId(req, res);
      expect(res.json).toHaveBeenCalledWith({ joinedCourses: [{ id: 'e1' }] });
    });
    test('getJoinedCoursesByCourseId handles error', async () => {
      const req = { params: { courseId: 'c1' } };
      const res = mockRes();
      prisma.courseEnrollment.findMany.mockRejectedValue(new Error('db'));
      await controller.getJoinedCoursesByCourseId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching joined courses' });
    });
  });

  describe('forum messages and reviews', () => {
    test('getForumMessagesByCourseId returns forumPosts', async () => {
      const req = { params: { courseId: '3' } };
      const res = mockRes();
      prisma.forumPost.findMany.mockResolvedValue([{ id: 10 }]);
      await controller.getForumMessagesByCourseId(req, res);
      expect(prisma.forumPost.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ forumPosts: [{ id: 10 }] });
    });
    test('getForumMessagesByCourseId handles error', async () => {
      const req = { params: { courseId: '3' } };
      const res = mockRes();
      prisma.forumPost.findMany.mockRejectedValue(new Error('db'));
      await controller.getForumMessagesByCourseId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching forum messages' });
    });

    test('getCourseReviews returns reviews', async () => {
      const req = { params: { courseId: 'c1' } };
      const res = mockRes();
      prisma.courseReview.findMany.mockResolvedValue([{ id: 'r1' }]);
      await controller.getCourseReviews(req, res);
      expect(res.json).toHaveBeenCalledWith({ reviews: [{ id: 'r1' }] });
    });
    test('getCourseReviews handles error', async () => {
      const req = { params: { courseId: 'c1' } };
      const res = mockRes();
      prisma.courseReview.findMany.mockRejectedValue(new Error('db'));
      await controller.getCourseReviews(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching course reviews' });
    });

    test('postCourseReview prevents duplicate', async () => {
      const req = { body: { courseId: 'c1', rating: 5, review: 'g', userId: 'u1' } };
      const res = mockRes();
      prisma.courseReview.findFirst.mockResolvedValue({ id: 'r1' });
      await controller.postCourseReview(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'User has already reviewed this course' });
    });
    test('postCourseReview creates review', async () => {
      const req = { body: { courseId: 'c1', rating: 5, review: 'g', userId: 'u1' } };
      const res = mockRes();
      prisma.courseReview.findFirst.mockResolvedValue(null);
      prisma.courseReview.create.mockResolvedValue({ id: 'r2' });
      await controller.postCourseReview(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ review: { id: 'r2' } });
    });
    test('postCourseReview handles error', async () => {
      const req = { body: { courseId: 'c1', rating: 5, review: 'g', userId: 'u1' } };
      const res = mockRes();
      prisma.courseReview.findFirst.mockRejectedValue(new Error('db'));
      await controller.postCourseReview(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});


