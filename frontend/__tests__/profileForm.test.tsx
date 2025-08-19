import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ProfileForm from "../src/components/profileForm";

describe("ProfileForm", () => {
  const setup = (overrides?: Partial<React.ComponentProps<typeof ProfileForm>>) => {
    const onProfileComplete = jest.fn().mockResolvedValue(undefined);
    const userEmail = "user@example.com";

    render(
      <ProfileForm
        onProfileComplete={onProfileComplete}
        userEmail={userEmail}
        {...overrides}
      />
    );

    const nameInput = screen.getByLabelText(/your name/i) as HTMLInputElement;
    const submitButton = screen.getByRole("button");

    return { onProfileComplete, userEmail, nameInput, submitButton };
  };

  test("renders header, email, input and submit button", () => {
    const { userEmail } = setup();

    expect(
      screen.getByRole("heading", { name: /complete your profile/i })
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(userEmail, "i"))).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete registration/i })
    ).toBeInTheDocument();
  });

  test("shows validation error when submitting empty name", async () => {
    const { submitButton, onProfileComplete } = setup();
    const user = userEvent.setup();

    await user.click(submitButton);

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(onProfileComplete).not.toHaveBeenCalled();
  });

  test("shows min length error for short name", async () => {
    const { nameInput, submitButton } = setup();
    const user = userEvent.setup();

    await user.type(nameInput, "A");
    await user.click(submitButton);

    expect(
      screen.getByText(/name must be at least 2 characters/i)
    ).toBeInTheDocument();
  });

  test("clears name error when user corrects input", async () => {
    const { nameInput, submitButton } = setup();
    const user = userEvent.setup();

    await user.type(nameInput, "A");
    await user.click(submitButton);
    expect(
      screen.getByText(/name must be at least 2 characters/i)
    ).toBeInTheDocument();

    await user.type(nameInput, "B");
    expect(
      screen.queryByText(/name must be at least 2 characters/i)
    ).not.toBeInTheDocument();
  });

  test("successful submit calls onProfileComplete with trimmed name and shows loading state", async () => {
    let resolveComplete: (value: void) => void;
    const pending = new Promise<void>((resolve) => {
      resolveComplete = resolve;
    });
    const onProfileComplete = jest.fn().mockReturnValue(pending);
    render(
      <ProfileForm onProfileComplete={onProfileComplete} userEmail="user@example.com" />
    );

    const user = userEvent.setup();
    const nameInput = screen.getByLabelText(/your name/i);
    const submitButton = screen.getByRole("button", { name: /complete registration/i });

    await user.type(nameInput, "  John Doe  ");
    await user.click(submitButton);

    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();

    expect(onProfileComplete).toHaveBeenCalledTimes(1);
    expect(onProfileComplete).toHaveBeenCalledWith("John Doe");

    // Resolve the pending completion to finish loading
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolveComplete!();

    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /complete registration/i })
      ).toBeEnabled();
    });
  });

  test("failed submit shows submit error and stops loading", async () => {
    const onProfileComplete = jest.fn().mockRejectedValue(new Error("boom"));
    render(
      <ProfileForm onProfileComplete={onProfileComplete} userEmail="user@example.com" />
    );

    const user = userEvent.setup();
    const nameInput = screen.getByLabelText(/your name/i);
    const submitButton = screen.getByRole("button");

    await user.type(nameInput, "Jane Doe");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to complete registration/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /complete registration/i })
    ).toBeEnabled();
    expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
  });

  test("pressing Enter in the input triggers submit when valid", async () => {
    const onProfileComplete = jest.fn().mockResolvedValue(undefined);
    render(
      <ProfileForm onProfileComplete={onProfileComplete} userEmail="user@example.com" />
    );

    const nameInput = screen.getByLabelText(/your name/i);

    await userEvent.type(nameInput, "Johnny");
    fireEvent.keyPress(nameInput, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(onProfileComplete).toHaveBeenCalledTimes(1);
      expect(onProfileComplete).toHaveBeenCalledWith("Johnny");
    });
  });
});


