import config from '../src/config';

describe('config', () => {
  it('exposes BACKEND_URL', () => {
    expect(typeof config.BACKEND_URL).toBe('string');
  });
});


