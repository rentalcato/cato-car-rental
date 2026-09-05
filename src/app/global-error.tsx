"use client";

import { useEffect } from "react";

/**
 * Last-resort fallback for an error thrown by the root layout itself
 * (src/app/layout.tsx) — the one case error.tsx can't catch, since it
 * needs a layout to render inside. Must render its own complete
 * <html>/<body>; deliberately minimal (no shadcn components, no
 * next/font) so this boundary has as little as possible that could
 * itself fail.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", color: "#666", fontSize: "0.875rem" }}>
          The application hit an unexpected error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
