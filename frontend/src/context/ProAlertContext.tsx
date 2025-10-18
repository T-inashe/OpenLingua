import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ProAlertVariant = "success" | "error" | "info";

type Alert = {
  id: number;
  message: string;
  variant: ProAlertVariant;
};

type ProAlertContextValue = {
  show: (message: string, variant?: ProAlertVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ProAlertContext = createContext<ProAlertContextValue | undefined>(undefined);

const variantStyles: Record<ProAlertVariant, string> = {
  success: "border-green-400/70 bg-slate-900/95 text-green-100",
  error: "border-red-400/70 bg-slate-900/95 text-red-100",
  info: "border-cyan-400/70 bg-slate-900/95 text-cyan-100",
};

let nextId = 1;

export const ProAlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const removeAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ProAlertVariant = "info") => {
    const id = nextId++;
    setAlerts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      removeAlert(id);
    }, 4000);
  }, [removeAlert]);

  const value = useMemo<ProAlertContextValue>(() => ({
    show,
    success: (message) => show(message, "success"),
    error: (message) => show(message, "error"),
    info: (message) => show(message, "info"),
  }), [show]);

  return (
    <ProAlertContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex max-w-sm flex-col gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur-md transition-all duration-300 ${variantStyles[alert.variant]}`}
          >
            <span className="text-sm font-medium leading-snug">{alert.message}</span>
            <button
              type="button"
              onClick={() => removeAlert(alert.id)}
              className="ml-auto text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ProAlertContext.Provider>
  );
};

export const useProAlert = () => {
  const context = useContext(ProAlertContext);
  if (!context) {
    throw new Error("useProAlert must be used within a ProAlertProvider");
  }
  return context;
};
