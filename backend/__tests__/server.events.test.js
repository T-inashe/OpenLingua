describe('server.js process error handlers', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('handles uncaughtException by logging and exiting with code 1', () => {
    jest.isolateModules(() => {
      // Mocks per module instance
      jest.doMock('path', () => ({
        resolve: jest.fn(() => 'mocked/.env'),
        join: jest.requireActual('path').join,
        dirname: jest.requireActual('path').dirname,
        sep: jest.requireActual('path').sep,
      }));
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      jest.doMock('../src/app', () => {
        const listen = jest.fn((port, host, cb) => cb && cb());
        return { listen };
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

      require('../src/server');

      // Grab the last registered handler to clean up after emit
      const handlers = process.listeners('uncaughtException');
      const handler = handlers[handlers.length - 1];

      const boom = new Error('boom');
      // Emit the event
      process.emit('uncaughtException', boom);

      expect(errorSpy).toHaveBeenCalledWith('Uncaught Exception:', boom);
      expect(exitSpy).toHaveBeenCalledWith(1);

      // Cleanup: remove our handler to avoid test leakage
      process.removeListener('uncaughtException', handler);
    });
  });

  test('handles unhandledRejection by logging and exiting with code 1', () => {
    jest.isolateModules(() => {
      jest.doMock('path', () => ({
        resolve: jest.fn(() => 'mocked/.env'),
        join: jest.requireActual('path').join,
        dirname: jest.requireActual('path').dirname,
        sep: jest.requireActual('path').sep,
      }));
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      jest.doMock('../src/app', () => {
        const listen = jest.fn((port, host, cb) => cb && cb());
        return { listen };
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

      require('../src/server');

      const handlers = process.listeners('unhandledRejection');
      const handler = handlers[handlers.length - 1];

      const reason = new Error('rej');
      // Node passes (reason, promise), our handler takes the first arg
      process.emit('unhandledRejection', reason, Promise.resolve());

      expect(errorSpy).toHaveBeenCalledWith('Unhandled Rejection:', reason);
      expect(exitSpy).toHaveBeenCalledWith(1);

      process.removeListener('unhandledRejection', handler);
    });
  });
});
