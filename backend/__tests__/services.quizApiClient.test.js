// Note: Don't import QuizApiError at top-level to avoid module identity mismatch with isolateModules
const { QuizApiClient } = require('../src/services/quizApiClient');

describe('QuizApiClient', () => {
  let axiosCreateMock;
  let axiosInstance;
  let errorInterceptor;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    // Mock axios instance
    axiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn((success, error) => { errorInterceptor = error; })
        }
      }
    };
    axiosCreateMock = jest.fn(() => axiosInstance);
    jest.doMock('axios', () => ({ create: axiosCreateMock }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const makeClient = () => {
    const { QuizApiClient } = require('../src/services/quizApiClient');
    return new QuizApiClient();
  };

  test('creates axios client with expected defaults', () => {
    makeClient();
    expect(axiosCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: expect.any(String),
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    }));
    expect(typeof errorInterceptor).toBe('function');
  });

  test('respects QUIZ_API_URL environment override for baseURL', () => {
    const orig = process.env.QUIZ_API_URL;
    process.env.QUIZ_API_URL = 'https://api.example.com';
    // Re-require to pick up env
    const { QuizApiClient } = require('../src/services/quizApiClient');
    new QuizApiClient();
    expect(axiosCreateMock).toHaveBeenCalledWith(expect.objectContaining({ baseURL: 'https://api.example.com' }));
    process.env.QUIZ_API_URL = orig;
  });

  test('createQuiz sends payload and headers', async () => {
    const client = makeClient();
    axiosInstance.post.mockResolvedValue({ data: { id: 'q1' } });
    const data = await client.createQuiz({ title: 'T' }, 'c1', 'u1');
    expect(axiosInstance.post).toHaveBeenCalledWith(
      '/api/v1/quizzes',
      expect.objectContaining({ title: 'T', course_id: 'c1', instructor_id: 'u1', created_via: 'openlingua_proxy' }),
      { headers: { 'X-Course-ID': 'c1', 'X-User-ID': 'u1' } }
    );
    expect(data).toEqual({ id: 'q1' });
  });

  test('getQuiz sets course header', async () => {
    const client = makeClient();
    axiosInstance.get.mockResolvedValue({ data: { id: 'q2' } });
    const data = await client.getQuiz('ext1', 'c1');
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/v1/quizzes/ext1', { headers: { 'X-Course-ID': 'c1' } });
    expect(data).toEqual({ id: 'q2' });
  });

  test('updateQuiz and deleteQuiz send headers', async () => {
    const client = makeClient();
    axiosInstance.put.mockResolvedValue({ data: { updated: true } });
    axiosInstance.delete.mockResolvedValue({ data: { deleted: true } });
    await client.updateQuiz('ext1', { title: 'A' }, 'c1', 'u1');
    expect(axiosInstance.put).toHaveBeenCalledWith(
      '/api/v1/quizzes/ext1',
      expect.objectContaining({ title: 'A', course_id: 'c1', instructor_id: 'u1' }),
      { headers: { 'X-Course-ID': 'c1', 'X-User-ID': 'u1' } }
    );
    await client.deleteQuiz('ext1', 'c1', 'u1');
    expect(axiosInstance.delete).toHaveBeenCalledWith(
      '/api/v1/quizzes/ext1',
      { headers: { 'X-Course-ID': 'c1', 'X-User-ID': 'u1' } }
    );
  });

  test('session APIs send correct bodies/headers', async () => {
    const client = makeClient();
    axiosInstance.post.mockResolvedValue({ data: { started: true } });
    await client.startQuizSession('ext1', 's1', 'c1');
    expect(axiosInstance.post).toHaveBeenCalledWith(
      '/api/v1/quiz-sessions/start/ext1',
      { student_id: 's1', course_id: 'c1' },
      { headers: { 'X-Course-ID': 'c1', 'X-Student-ID': 's1' } }
    );

    axiosInstance.post.mockResolvedValue({ data: { submitted: true } });
    await client.submitQuizAnswers('ext1', { a: 1 }, 'sess1', 's1');
    expect(axiosInstance.post).toHaveBeenCalledWith(
      '/api/v1/quiz-sessions/submit/ext1',
      { session_id: 'sess1', answers: { a: 1 }, student_id: 's1' }
    );
  });

  test('getQuizStats passes params and headers', async () => {
    const client = makeClient();
    axiosInstance.get.mockResolvedValue({ data: { attempts: 3 } });
    await client.getQuizStats('ext1', 'c1');
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/api/v1/quiz-sessions/stats/ext1',
      { params: { course_id: 'c1' }, headers: { 'X-Course-ID': 'c1' } }
    );
  });

  test('healthCheck returns healthy with response data and time', async () => {
    const client = makeClient();
    axiosInstance.get.mockResolvedValue({ data: { ok: true }, headers: { 'x-response-time': '10ms' } });
    const res = await client.healthCheck();
    expect(res).toEqual({ status: 'healthy', data: { ok: true }, responseTime: '10ms' });
  });

  test('healthCheck returns unhealthy on error', async () => {
    const client = makeClient();
    axiosInstance.get.mockRejectedValue(new Error('down'));
    const res = await client.healthCheck();
    expect(res.status).toBe('unhealthy');
    expect(res.error).toBe('down');
    expect(res).toHaveProperty('timestamp');
  });

  test('error interceptor maps timeouts to QuizApiError', async () => {
    const client = makeClient();
    // Make post reject and ensure interceptor transforms error
    const rawError = { code: 'ECONNABORTED' };
    axiosInstance.post.mockImplementation(() => Promise.reject(rawError).catch(errorInterceptor));
    await expect(client.createQuiz({}, 'c1', 'u1')).rejects.toMatchObject({ name: 'QuizApiError', type: 'TIMEOUT', statusCode: 503 });
  });

  test('error interceptor maps 404 to QuizApiError NOT_FOUND', async () => {
    makeClient();
    const rawError = { response: { status: 404 } };
    axiosInstance.get.mockImplementation(() => Promise.reject(rawError).catch(errorInterceptor));
    await expect(require('../src/services/quizApiClient').QuizApiClient.prototype.getQuiz.call({ client: axiosInstance }, 'x', 'c1')).rejects.toMatchObject({ type: 'NOT_FOUND', statusCode: 404 });
  });

  test('error interceptor maps 5xx to SERVER_ERROR', async () => {
    const client = makeClient();
    const rawError = { response: { status: 503 } };
    axiosInstance.get.mockImplementation(() => Promise.reject(rawError).catch(errorInterceptor));
    await expect(client.getQuiz('x', 'c1')).rejects.toMatchObject({ type: 'SERVER_ERROR', statusCode: 503 });
  });

  test('error interceptor maps unknown to EXTERNAL_API_ERROR with status', async () => {
    const client = makeClient();
    const rawError = { response: { status: 422 }, response: { data: { message: 'invalid' }, status: 422 } };
    axiosInstance.delete.mockImplementation(() => Promise.reject(rawError).catch(errorInterceptor));
    await expect(client.deleteQuiz('ext', 'c1', 'u1')).rejects.toMatchObject({ type: 'EXTERNAL_API_ERROR', statusCode: 422 });
  });

  test('error interceptor maps no-response errors to EXTERNAL_API_ERROR with 500', async () => {
    const client = makeClient();
    const rawError = new Error('network');
    axiosInstance.put.mockImplementation(() => Promise.reject(rawError).catch(errorInterceptor));
    await expect(client.updateQuiz('ext1', { title: 'T' }, 'c1', 'u1')).rejects.toMatchObject({ type: 'EXTERNAL_API_ERROR', statusCode: 500 });
  });

  describe('withRetry', () => {
    let timeoutSpy;
    beforeEach(() => {
      // Make setTimeout invoke immediately to avoid relying on fake timers
      timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return 0;
      });
    });
    afterEach(() => {
      timeoutSpy.mockRestore();
    });

    test('retries on server error and eventually succeeds', async () => {
      const client = makeClient();
      let count = 0;
      const op = jest.fn(async () => {
        count += 1;
        if (count < 3) {
          const err = Object.assign(new Error('server'), { statusCode: 503 });
          throw err;
        }
        return 'ok';
      });

      const result = await client.withRetry(op, 3, 10);
      expect(result).toBe('ok');
      expect(op).toHaveBeenCalledTimes(3);
    });

    test('does not retry on client error (4xx)', async () => {
      const client = makeClient();
      const err = Object.assign(new Error('bad'), { statusCode: 400 });
      const op = jest.fn(async () => { throw err; });
      await expect(client.withRetry(op, 3, 10)).rejects.toBe(err);
      expect(op).toHaveBeenCalledTimes(1);
    });

    test('exhausts retries and throws last error', async () => {
      const client = makeClient();
      const err = Object.assign(new Error('server'), { statusCode: 503 });
      const op = jest.fn(async () => { throw err; });
      await expect(client.withRetry(op, 2, 10)).rejects.toBe(err);
      expect(op).toHaveBeenCalledTimes(2);
    });
  });
});
