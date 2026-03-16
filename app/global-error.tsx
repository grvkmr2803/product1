"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#060009", margin: 0, fontFamily: "'Playfair Display', serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>💔</div>
          <h1 style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#ff3d8b",
            marginBottom: 12,
            fontFamily: "'Syne', sans-serif",
          }}>
            Something broke.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: 40, maxWidth: 400 }}>
            Even the darkest archives have off days. Let's get you back.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              onClick={reset}
              style={{
                padding: "14px 32px",
                borderRadius: 50,
                background: "linear-gradient(135deg,#ff3d8b,#bf5af2)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Try Again
            </button>
            <Link href="/" style={{
              padding: "14px 32px",
              borderRadius: 50,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              fontFamily: "'Syne', sans-serif",
            }}>
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}