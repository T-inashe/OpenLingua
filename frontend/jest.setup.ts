// Jest setup for React Testing Library matchers
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for react-router-dom in JSDOM
import { TextEncoder, TextDecoder } from 'util';
// @ts-ignore
if (!global.TextEncoder) {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
// @ts-ignore
if (!global.TextDecoder) {
  // @ts-ignore
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// Basic global fetch mock for components using fetch in effects
// @ts-ignore
if (!global.fetch) {
  // @ts-ignore
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ courses: [], posts: [], reviews: [], course: { title: 'Test' } })
  });
}

jest.mock('axios');

// Silence window.alert in tests
// @ts-ignore
if (!global.alert) {
  // @ts-ignore
  global.alert = jest.fn();
}


