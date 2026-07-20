"use client";

import { useEffect, useTransition } from "react";
import { reportClientError } from "@/lib/actions-ops";
import { useToast } from "@/components/ui/toast";

/** Catch unhandled errors → friendly toast + server log. */
export function ErrorReporter() {
  const [, start] = useTransition();
  const { error: toastError } = useToast();

  useEffect(() => {
    function onError(event: ErrorEvent) {
      toastError("Something went wrong. We've been notified.");
      start(async () => {
        await reportClientError({
          message: event.message || "Unknown error",
          stack: event.error?.stack ?? null,
          context: "window.onerror",
          url: window.location.href,
        });
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      toastError("Something went wrong. We've been notified.");
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled rejection";
      const stack = reason instanceof Error ? reason.stack : null;
      start(async () => {
        await reportClientError({
          message,
          stack: stack ?? null,
          context: "unhandledrejection",
          url: window.location.href,
        });
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [toastError]);

  return null;
}
