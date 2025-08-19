import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import SignUp from "../src/components/signUp";
import config from "../src/config";
import * as navigateModule from "../src/utils/navigate";

describe("SignUp", () => {
  jest.setTimeout(20000);
  const renderWithRoutes = () =>
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

  const renderBasic = () =>
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = jest.fn();
  });

  test("renders initial form elements", () => {
    renderWithRoutes();
    expect(
      screen.getByRole("heading", { name: /join openlingua/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/create a password \(min 8 characters\)/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continue$/i })).toBeInTheDocument();
  });

  test("clicking Continue shows ProfileForm with user email", async () => {
    renderWithRoutes();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(
      screen.getByPlaceholderText(/create a password/i),
      "password123"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm your password/i),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));

    expect(
      screen.getByRole("heading", { name: /complete your profile/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
  });

  test("successful registration posts to backend and navigates to dashboard", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

    renderWithRoutes();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/create a password/i), "password123");
    await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));

    // In ProfileForm
    const nameInput = await screen.findByPlaceholderText(/enter your full name/i);
    await user.type(nameInput, "John Doe");
    await user.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const expectedUrl = `${config.BACKEND_URL}/api/auth/register`;
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: "user@example.com", password: "password123", name: "John Doe" }),
    }));

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  test("registration failure shows error on SignUp form and returns from ProfileForm", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Registration failed" }) });

    renderWithRoutes();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/create a password/i), "password123");
    await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));

    const nameInput = await screen.findByPlaceholderText(/enter your full name/i);
    await user.type(nameInput, "John Doe");
    await user.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      // Back on SignUp form with error rendered
      expect(screen.getByRole("heading", { name: /join openlingua/i })).toBeInTheDocument();
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  test("network error shows generic error and returns from ProfileForm", async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("network"));

    renderWithRoutes();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/create a password/i), "password123");
    await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^Continue$/i }));

    const nameInput2 = await screen.findByPlaceholderText(/enter your full name/i);
    await user.type(nameInput2, "John Doe");
    await user.click(screen.getByRole("button", { name: /complete registration/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/network error\. please try again\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /join openlingua/i })
      ).toBeInTheDocument();
    });
  });

  test("pressing Enter in confirm field triggers Continue and shows ProfileForm", async () => {
    renderWithRoutes();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/create a password/i), "password123");
    const confirm = screen.getByPlaceholderText(/confirm your password/i);
    await user.type(confirm, "password123");
    fireEvent.keyPress(confirm, { key: "Enter", code: "Enter", charCode: 13 });

    expect(
      await screen.findByRole("heading", { name: /complete your profile/i })
    ).toBeInTheDocument();
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
      renderBasic();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /continue with google/i }));
      expect(navigateModule.navigateTo).toHaveBeenCalledWith(
        `${config.BACKEND_URL}/api/auth/google`
      );
    });

    test("Microsoft redirect", async () => {
      renderBasic();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /continue with microsoft/i }));
      expect(navigateModule.navigateTo).toHaveBeenCalledWith(
        `${config.BACKEND_URL}/api/auth/microsoft`
      );
    });
  });
});


