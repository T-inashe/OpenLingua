describe('config/passport', () => {
  const realEnv = { ...process.env };
  let passportMock;
  let capturedSerialize;
  let capturedDeserialize;
  let GoogleStrategyMock;
  let strategyInstance;
  let capturedVerify;
  let prismaMock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...realEnv };
    process.env.GOOGLE_CLIENT_ID = 'cid';
    process.env.GOOGLE_CLIENT_SECRET = 'csecret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:8080/auth/google/callback';

    // Silence logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Build fresh mocks per test
    capturedSerialize = undefined;
    capturedDeserialize = undefined;
    capturedVerify = undefined;
    strategyInstance = { name: 'google' };

    passportMock = {
      use: jest.fn(),
      serializeUser: jest.fn((fn) => { capturedSerialize = fn; }),
      deserializeUser: jest.fn((fn) => { capturedDeserialize = fn; }),
    };

    GoogleStrategyMock = jest.fn(function (options, verify) {
      capturedVerify = verify;
      // surface options on instance for inspection if needed
      strategyInstance.options = options;
      return strategyInstance;
    });

    prismaMock = {
      user: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    jest.doMock('passport', () => passportMock);
    jest.doMock('passport-google-oauth20', () => ({ Strategy: GoogleStrategyMock }));
    jest.doMock('../src/lib/prisma', () => prismaMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('registers Google strategy with expected options', () => {
    jest.isolateModules(() => {
      require('../src/config/passport');
    });

    expect(GoogleStrategyMock).toHaveBeenCalledTimes(1);
    const opts = strategyInstance.options;
    expect(opts).toMatchObject({
      clientID: 'cid',
      clientSecret: 'csecret',
      callbackURL: 'http://localhost:8080/auth/google/callback',
      proxy: true,
    });

    expect(passportMock.use).toHaveBeenCalledWith(strategyInstance);
    expect(typeof capturedVerify).toBe('function');
    expect(passportMock.serializeUser).toHaveBeenCalled();
    expect(passportMock.deserializeUser).toHaveBeenCalled();
  });

  test('verify callback upserts user and calls done with user', async () => {
    jest.isolateModules(() => {
      require('../src/config/passport');
    });
    const fakeUser = { id: 'u1', email: 'e@x.com' };
    prismaMock.user.upsert.mockResolvedValue(fakeUser);
    const done = jest.fn();
    const profile = {
      id: 'gid',
      displayName: 'Test User',
      emails: [{ value: 'e@x.com' }],
      photos: [{ value: 'http://avatar' }],
    };

    await capturedVerify('at', 'rt', profile, done);

    expect(prismaMock.user.upsert).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, fakeUser);
  });

  test('verify callback handles error and calls done with error', async () => {
    jest.isolateModules(() => {
      require('../src/config/passport');
    });
    const err = new Error('db down');
    prismaMock.user.upsert.mockRejectedValue(err);
    const done = jest.fn();
    const profile = { id: 'gid', displayName: 'X', emails: [{ value: 'e@x.com' }], photos: [] };

    await capturedVerify('at', 'rt', profile, done);

    expect(done).toHaveBeenCalledWith(err, null);
  });

  test('serializeUser stores id', async () => {
    jest.isolateModules(() => {
      require('../src/config/passport');
    });
    const done = jest.fn();
    capturedSerialize({ id: 'u123' }, done);
    expect(done).toHaveBeenCalledWith(null, 'u123');
  });

  test('deserializeUser looks up user and returns it', async () => {
    jest.isolateModules(() => {
      require('../src/config/passport');
    });
    const done = jest.fn();
    const user = { id: 'u42' };
    prismaMock.user.findUnique.mockResolvedValue(user);
    await capturedDeserialize('u42', done);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u42' } });
    expect(done).toHaveBeenCalledWith(null, user);
  });

  test('deserializeUser passes error when prisma fails', async () => {
    jest.isolateModules(() => {
      require('../src/config/passport');
    });
    const done = jest.fn();
    prismaMock.user.findUnique.mockRejectedValue(new Error('oops'));
    await capturedDeserialize('u99', done);
    expect(done).toHaveBeenCalledWith(expect.any(Error), null);
  });
});
