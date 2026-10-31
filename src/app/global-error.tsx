"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#fff9f8",
          color: "#30283d",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>Erreur technique</h1>
          <p style={{ fontSize: 14, color: "#988a9b" }}>
            Une erreur est survenue. Réessaie dans un instant.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              height: 48,
              padding: "0 24px",
              borderRadius: 13,
              border: "none",
              background: "#dd7099",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
