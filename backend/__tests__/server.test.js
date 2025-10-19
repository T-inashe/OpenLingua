jest.mock('path', () => ({
  resolve: jest.fn(() => 'mocked/.env'),
  join: jest.requireActual('path').join,
  dirname: jest.requireActual('path').dirname,
  sep: jest.requireActual('path').sep,
}));

// Mock dotenv so requiring server.js doesn’t actually read files
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock the app so server.js can call listen on it
jest.mock('../src/app', () => {
  const listen = jest.fn((port, host, cb) => cb && cb());
  return { listen };
});

describe('server.js startup', () => {
  const originalEnv = process.env;
  let logSpy;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    logSpy && logSpy.mockRestore();
    try {
      const dotenv = require('dotenv');
      dotenv.config.mockClear();
    } catch {}
    try {
      const app = require('../src/app');
      app.listen && app.listen.mockClear();
    } catch {}
  });

  test('uses PORT from env and binds to 0.0.0.0', () => {
    process.env.PORT = '9090';
    // Require after setting env so server picks it up
    require('../src/server');
    const dotenv = require('dotenv');
    const app = require('../src/app');
    expect(dotenv.config).toHaveBeenCalledWith({ path: expect.stringContaining('.env') });
    expect(app.listen).toHaveBeenCalledWith(9090, '0.0.0.0', expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith('Server running on port 9090');
  });

  test('defaults to 8080 when PORT not set', () => {
    delete process.env.PORT;
    require('../src/server');
    const app = require('../src/app');
    expect(app.listen).toHaveBeenCalledWith(8080, '0.0.0.0', expect.any(Function));
  });
});
