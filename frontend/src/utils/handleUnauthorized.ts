import type { ProAlertVariant } from "../context/ProAlertContext";

export type NavigateFunction = (to: string, options?: { replace?: boolean }) => void;
export type ProAlert = {
  show: (message: string, variant?: ProAlertVariant) => void;
  info: (message: string) => void;
};

export const handleUnauthorized = (
  response: Response,
  navigate: NavigateFunction,
  proAlert?: ProAlert,
): boolean => {
  if (response.status === 401) {
    proAlert?.info("Your session has expired. Please sign in again.");
    navigate("/signIn", { replace: true });
    return true;
  }

  return false;
};
