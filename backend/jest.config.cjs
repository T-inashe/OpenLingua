/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 20000,
  // Always collect coverage so summary shows without extra flags
  collectCoverage: true,
  // Focus coverage on application source files
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!**/*.test.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  coverageReporters: ['text', 'text-summary', 'lcov'],
  // Ensure default reporter prints summary table
  reporters: ['default'],
};
