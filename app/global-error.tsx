"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#070b11",
          color: "#e6edf7",
          fontFamily: "monospace",
          margin: 0,
        }}
      >
        <main
          style={{
            display: "grid",
            minHeight: "100vh",
            padding: "24px",
            placeItems: "center",
          }}
        >
          <section
            style={{
              border: "1px solid #25334a",
              maxWidth: "560px",
              padding: "32px",
              width: "100%",
            }}
          >
            <p style={{ color: "#58a6ff", letterSpacing: "0.16em" }}>
              SYSTEM_ERROR
            </p>
            <h1>Mission interrupted</h1>
            <p style={{ color: "#9ba9bc", lineHeight: 1.6 }}>
              The application could not finish loading. No diagnostic details
              are exposed in this screen.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#16345d",
                border: "1px solid #4593ef",
                color: "#e6edf7",
                cursor: "pointer",
                marginTop: "16px",
                padding: "10px 16px",
              }}
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
