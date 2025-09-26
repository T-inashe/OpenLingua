import type { NavigateFunction } from "react-router-dom";
import { ProAlertVariant } from "../context/ProAlertContext";

type ProAlert = {
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
