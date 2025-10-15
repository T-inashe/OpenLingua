const { generateEmailToken, generateTokenExpiry } = require('../src/utils/tokens');

describe('utils/tokens', () => {
  test('generateEmailToken returns a 64-char hex string', () => {
    const token = generateEmailToken();
    expect(typeof token).toBe('string');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  test('generateTokenExpiry returns a Date in the future (default 24h)', () => {
    const now = Date.now();
    const expiry = generateTokenExpiry();
    expect(expiry).toBeInstanceOf(Date);
    expect(expiry.getTime()).toBeGreaterThan(now + 23 * 60 * 60 * 1000);
    expect(expiry.getTime()).toBeLessThan(now + 25 * 60 * 60 * 1000);
  });

  test('generateTokenExpiry accepts custom hours', () => {
    const now = Date.now();
    const expiry = generateTokenExpiry(2);
    expect(expiry.getTime()).toBeGreaterThanOrEqual(now + 2 * 60 * 60 * 1000 - 10);
    expect(expiry.getTime()).toBeLessThan(now + 2 * 60 * 60 * 1000 + 2000);
  });
});


