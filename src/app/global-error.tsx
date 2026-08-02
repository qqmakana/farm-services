"use client";

import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, Segoe UI, sans-serif",
          background: "#fff",
          color: "#0f172a",
        }}
      >
        <main
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "4rem 1.25rem",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
            {BRAND.appName}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0.5rem 0" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#475569" }}>
            Contact support on WhatsApp or email.
          </p>
          <div
            style={{
              display: "grid",
              gap: 8,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: 12,
                background: "#000",
                color: "#fff",
                fontWeight: 700,
                padding: "14px 16px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href={`${BRAND_WHATSAPP_HREF}?text=${encodeURIComponent(
                `Hi ${BRAND.appName} support — critical error${
                  error.digest ? ` (${error.digest})` : ""
                }`,
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{
                borderRadius: 12,
                background: "#25D366",
                color: "#fff",
                fontWeight: 700,
                padding: "14px 16px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              WhatsApp {BRAND.phone}
            </a>
            <a
              href={`mailto:${BRAND.email}?subject=${encodeURIComponent(
                `${BRAND.appName} support`,
              )}`}
              style={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                color: "#000",
                fontWeight: 700,
                padding: "14px 16px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Email {BRAND.email}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
