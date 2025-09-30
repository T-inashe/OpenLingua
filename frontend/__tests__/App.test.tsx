import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

import { render, screen } from "@testing-library/react";
import App from "../src/App";
import "@testing-library/jest-dom";

test("renders without crashing", () => {
  render(<App />);
  expect(
  screen.getByRole("heading", { name: /Diversity is Now/i })
).toBeInTheDocument();
expect(
  screen.getByText(/Learn a new language at your own pace/i)
).toBeInTheDocument();
});
