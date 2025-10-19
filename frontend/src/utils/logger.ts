/**
 * Conditional logger utility for development
 * Only logs in development mode or when DEBUG is true
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isDebugEnabled = localStorage.getItem('DEBUG') === 'true';

const shouldLog = isDevelopment || isDebugEnabled;

export const logger = {
  log: (...args: any[]) => {
    if (shouldLog) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (shouldLog) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },
  
  info: (...args: any[]) => {
    if (shouldLog) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDebugEnabled) {
      console.debug(...args);
    }
  }
};

// For production, remove all logs except errors
export const noop = () => {};

// Export appropriate logger based on environment
export default shouldLog ? logger : {
  log: noop,
  warn: noop,
  error: console.error,
  info: noop,
  debug: noop
};
