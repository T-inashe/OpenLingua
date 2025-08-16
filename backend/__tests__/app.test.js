const request = require('supertest');
const app = require('../src/app');

describe('App Integration', () => {
  it('GET / should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Language Learning API is running!');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health should return server health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'OK', message: 'Server is healthy' });
  });
});