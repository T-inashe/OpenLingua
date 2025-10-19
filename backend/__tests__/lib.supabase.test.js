describe('lib/supabase', () => {
  const realEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...realEnv };
  });

  afterAll(() => {
    process.env = realEnv;
  });

  test('throws when env vars are missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => require('../src/lib/supabase')).toThrow(
      /Supabase storage environment variables are missing/
    );
  });

  test('creates client when env vars are present', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';

    const createClientMock = jest.fn(() => ({ auth: { persistSession: false } }));
    jest.isolateModules(() => {
      jest.doMock('@supabase/supabase-js', () => ({ createClient: createClientMock }));
      const mod = require('../src/lib/supabase');
      expect(mod).toBeDefined();
      expect(mod.supabase).toBeDefined();
      expect(createClientMock).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'service_key',
        { auth: { persistSession: false } }
      );
    });
  });
});
