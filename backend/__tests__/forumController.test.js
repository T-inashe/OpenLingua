const forum = require('../src/controllers/forumController');
const { prisma } = require('../src/lib/prisma');

jest.mock('../src/lib/prisma', () => ({ prisma: {
  forumPost: { create: jest.fn(), findMany: jest.fn() },
  forumReply: { create: jest.fn() }
} }));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('forumController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('createPost creates a post', async () => {
    const req = { params: { courseId: 'c1' }, body: { content: 'hi', userId: 'u1' } };
    const res = mockRes();
    prisma.forumPost.create.mockResolvedValue({ id: 1 });
    await forum.createPost(req, res);
    expect(prisma.forumPost.create).toHaveBeenCalledWith({ data: { content: 'hi', authorId: 'u1', courseId: 'c1' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created', post: { id: 1 } });
  });

  test('replyToPost creates a reply', async () => {
    const req = { params: { postId: '10' }, body: { content: 'ok' }, user: { userId: 'u2' } };
    const res = mockRes();
    prisma.forumReply.create.mockResolvedValue({ id: 2 });
    await forum.replyToPost(req, res);
    expect(prisma.forumReply.create).toHaveBeenCalledWith({ data: { content: 'ok', userId: 'u2', postId: 10 } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Reply added', reply: { id: 2 } });
  });

  test('getPosts returns posts', async () => {
    const req = { params: { courseId: 'c1' } };
    const res = mockRes();
    prisma.forumPost.findMany.mockResolvedValue([{ id: 3 }]);
    await forum.getPosts(req, res);
    expect(prisma.forumPost.findMany).toHaveBeenCalledWith({ where: { courseId: 'c1' }, include: { author: true }, orderBy: { createdAt: 'desc' } });
    expect(res.json).toHaveBeenCalledWith({ posts: [{ id: 3 }] });
  });
});


