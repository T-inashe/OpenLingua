import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import SignIn from "../src/components/signIn";
import * as navigateModule from "../src/utils/navigate";
import config from "../src/config";

describe("SignIn", () => {
  const renderWithRouter = () =>
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = jest.fn();
  });

  test("renders form elements", () => {
    renderWithRouter();

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("shows required errors when submitting empty form", async () => {
    renderWithRouter();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("shows format/length errors for invalid inputs", async () => {
    renderWithRouter();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "abc");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
    expect(
      screen.getByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  test("clears field errors when user corrects input", async () => {
    renderWithRouter();
    const user = userEvent.setup();

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submit = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "abc");
    await user.type(passwordInput, "123");
    await user.click(submit);
    expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
    expect(
      screen.getByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();

    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");
    await user.type(passwordInput, "456789");

    expect(screen.queryByText(/email is invalid/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/password must be at least 6 characters/i)
    ).not.toBeInTheDocument();
  });

  test("successful submit calls backend and toggles loading state", async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise<any>((resolve) => {
      resolveFetch = resolve;
    });
    (global as any).fetch = jest.fn().mockReturnValue(fetchPromise);

    renderWithRouter();
    const user = userEvent.setup();

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const button = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "secret1");
    await user.click(button);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    const expectedUrl = `${config.BACKEND_URL}/api/auth/login`;
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "secret1" }),
    }));

    // Resolve the pending fetch now
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolveFetch!({ ok: true, json: async () => ({ token: "t" }) });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  test("failed submit shows server error message", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    });

    renderWithRouter();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "secret1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test("network error shows generic error", async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("network"));

    renderWithRouter();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "secret1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/network error\. please try again\./i)
      ).toBeInTheDocument();
    });
  });

  test("pressing Enter in password submits when valid", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWithRouter();
    const user = userEvent.setup();

    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "secret1");
    fireEvent.keyPress(passwordInput, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("OAuth buttons", () => {
    let navigateSpy: jest.SpyInstance;
    beforeEach(() => {
      navigateSpy = jest.spyOn(navigateModule, "navigateTo").mockImplementation(() => {});
    });
    afterEach(() => {
      navigateSpy.mockRestore();
    });

    test("Google redirect", async () => {
      renderWithRouter();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /continue with google/i }));
      expect(navigateModule.navigateTo).toHaveBeenCalledWith(
        `${config.BACKEND_URL}/api/auth/google`
      );
    });

    test("Microsoft redirect", async () => {
      renderWithRouter();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /continue with microsoft/i }));
      expect(navigateModule.navigateTo).toHaveBeenCalledWith(
        `${config.BACKEND_URL}/api/auth/microsoft`
      );
    });
  });
});


