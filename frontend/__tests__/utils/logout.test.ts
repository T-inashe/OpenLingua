/**
 * @file logout.test.ts
 */
import { logoutRequest } from "../../src/utils/logout";
import config from "../../src/config";

describe("logoutRequest", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence console.error in tests
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (console.error as jest.Mock).mockRestore();
  });

  test("returns true when logout succeeds", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    const result = await logoutRequest();
    expect(global.fetch).toHaveBeenCalledWith(
      `${config.BACKEND_URL}/api/auth/logout`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(result).toBe(true);
  });

  test("returns false when response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "Failed logout",
    });

    const result = await logoutRequest();
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith("Logout failed", "Failed logout");
  });

  test("returns false when fetch throws an error", async () => {
    const error = new Error("Network error");
    (global.fetch as jest.Mock).mockRejectedValueOnce(error);

    const result = await logoutRequest();
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith("Logout error", error);
  });
});
