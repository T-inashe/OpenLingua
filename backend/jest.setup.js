// Global Jest setup for backend tests

// Frontend URL and paths for redirects in auth controller tests
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
process.env.FRONTEND_SIGNIN_PATH = process.env.FRONTEND_SIGNIN_PATH || '/login';
process.env.FRONTEND_DASHBOARD_PATH = process.env.FRONTEND_DASHBOARD_PATH || '/dashboard';

// Optional: silence noisy Prisma logs during tests
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
