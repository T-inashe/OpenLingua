describe('lib/prisma', () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...realEnv };
    delete global.prisma; // ensure no singleton reuse across tests
  });

  afterAll(() => {
    process.env = realEnv;
  });

  test('constructs PrismaClient with augmented DATABASE_URL and logs redacted success', async () => {
    const mockClient = {
      $connect: jest.fn().mockResolvedValue(),
      $disconnect: jest.fn().mockResolvedValue(),
    };
    const PrismaClientMock = jest.fn(() => mockClient);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    process.env.DATABASE_URL = 'postgres://user:pass@db.example.com:5432/appdb';

    jest.isolateModules(() => {
      jest.doMock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }));
      const mod = require('../src/lib/prisma');
      expect(mod).toBeDefined();
      // Default and named export should be same instance
      expect(mod).toBe(require('../src/lib/prisma').prisma);
    });

    // Allow the $connect().then() microtask to flush
    await Promise.resolve();

    expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    const arg = PrismaClientMock.mock.calls[0][0];
    expect(arg.log).toEqual(['error']);
    // Ensure datasources URL contains required params
    const url = arg.datasources.db.url;
    expect(url).toContain('sslmode=require');
    expect(url).toContain('pgbouncer=true');
    expect(url).toContain('connection_limit=1');
    expect(url).toContain('connect_timeout=30');

    expect(mockClient.$connect).toHaveBeenCalled();
    // Success log should include redacted URL form
    const found = logSpy.mock.calls.find((c) => String(c[0]).includes('Database connected successfully'));
    expect(found).toBeTruthy();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('logs error and hints when $connect rejects', async () => {
    const mockClient = {
      $connect: jest.fn().mockRejectedValue(new Error('boom')),
      $disconnect: jest.fn().mockResolvedValue(),
    };
    const PrismaClientMock = jest.fn(() => mockClient);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/appdb';

    jest.isolateModules(() => {
      jest.doMock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }));
      require('../src/lib/prisma');
    });

    // Allow .catch handler to execute (flush microtask queue)
    await new Promise((r) => setImmediate(r));

    expect(errorSpy).toHaveBeenCalled();
    const errMsg = errorSpy.mock.calls.map((args) => args.map(String).join(' ')).join('\n');
    expect(errMsg).toContain('Database connection failed');
    expect(errMsg).toContain('Host: localhost');

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('constructs without DATABASE_URL and does not pass datasources', async () => {
    const mockClient = {
      $connect: jest.fn().mockResolvedValue(),
      $disconnect: jest.fn().mockResolvedValue(),
    };
    const PrismaClientMock = jest.fn(() => mockClient);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    delete process.env.DATABASE_URL;

    jest.isolateModules(() => {
      jest.doMock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }));
      require('../src/lib/prisma');
    });

    await Promise.resolve();

    expect(PrismaClientMock).toHaveBeenCalled();
    const arg = PrismaClientMock.mock.calls[0][0];
    expect(arg.datasources).toBeUndefined();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
