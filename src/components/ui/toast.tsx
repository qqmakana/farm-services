"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONE_CLASS: Record<ToastTone, string> = {
  success: "bg-[#05944F] text-white",
  error: "bg-[#CB4040] text-white",
  info: "bg-[#0E0E0E] text-white",
  warning: "bg-[#0E0E0E] text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setItems((prev) => [...prev.slice(-4), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (m) => toast(m, "success"),
      error: (m) => toast(m, "error"),
      info: (m) => toast(m, "info"),
      warning: (m) => toast(m, "warning"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-3 px-4"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`vr-toast-enter pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[12px] px-5 py-3.5 text-[15px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${TONE_CLASS[t.tone]}`}
          >
            <span className="flex-1 text-center">{t.message}</span>
            <button
              type="button"
              className="shrink-0 text-white/80 hover:text-white"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (m: string) => {
        if (typeof window !== "undefined") console.info("[toast]", m);
      },
      success: (m: string) => console.info("[toast]", m),
      error: (m: string) => console.error("[toast]", m),
      info: (m: string) => console.info("[toast]", m),
      warning: (m: string) => console.warn("[toast]", m),
    } satisfies ToastApi;
  }
  return ctx;
}
