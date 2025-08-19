import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

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
