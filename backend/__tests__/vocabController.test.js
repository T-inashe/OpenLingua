const vocab = require('../src/controllers/vocabController');
const { prisma } = require('../src/lib/prisma');

jest.mock('../src/lib/prisma', () => ({ prisma: {
  vocabulary: { create: jest.fn(), findMany: jest.fn() }
} }));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('vocabController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('addWord creates vocabulary item', async () => {
    const req = { params: { courseId: '7' }, body: { word: 'hello', translation: 'hola', usage: 'hi' } };
    const res = mockRes();
    prisma.vocabulary.create.mockResolvedValue({ id: 1 });
    await vocab.addWord(req, res);
    expect(prisma.vocabulary.create).toHaveBeenCalledWith({ data: { word: 'hello', translation: 'hola', usage: 'hi', courseId: 7 } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Word added', vocab: { id: 1 } });
  });

  test('getWords returns items for course', async () => {
    const req = { params: { courseId: '9' } };
    const res = mockRes();
    prisma.vocabulary.findMany.mockResolvedValue([{ id: 2 }]);
    await vocab.getWords(req, res);
    expect(prisma.vocabulary.findMany).toHaveBeenCalledWith({ where: { courseId: 9 } });
    expect(res.json).toHaveBeenCalledWith({ words: [{ id: 2 }] });
  });
});


