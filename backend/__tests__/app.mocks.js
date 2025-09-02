// Lightweight mocks for modules not needed in unit tests
jest.mock('multer', () => {
  const multerFn = () => ({ single: () => (req, res, next) => next() });
  multerFn.diskStorage = () => ({ /* noop storage */ });
  return multerFn;
}, { virtual: true });

jest.mock('pg', () => ({
  Pool: function MockPool() { return { query: jest.fn(), end: jest.fn() }; }
}), { virtual: true });

// no-op test so Jest treats this file as a valid suite
test('setup mocks loaded', () => {
  expect(true).toBe(true);
});

