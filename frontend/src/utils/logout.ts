import config from "../config";

export async function logoutRequest(): Promise<boolean> {
  try {
    const response = await fetch(`${config.BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("Logout failed", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Logout error", error);
    return false;
  }
}
