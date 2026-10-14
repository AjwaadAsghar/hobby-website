"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", fontSize: 18, padding: 40, textAlign: "center" }}>
        <h1>Sorry, something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button onClick={reset} style={{ fontSize: 18, padding: "12px 24px", borderRadius: 12, cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
