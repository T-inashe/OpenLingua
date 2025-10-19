module.exports = {
  default: {
    post: jest.fn().mockResolvedValue({ data: { fileUrl: '/uploads/fake' } })
  }
};


