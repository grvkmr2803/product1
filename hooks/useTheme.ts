"use client";
import { useState, useEffect } from "react";

export type Mode = "obsidian" | "aether";

export function useTheme() {
  const [mode, setMode] = useState<Mode>("obsidian");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vibeMode") as Mode | null;
    if (saved) setMode(saved);
  }, []);

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === "obsidian" ? "aether" : "obsidian";
      localStorage.setItem("vibeMode", next);
      return next;
    });
  };

  return { mode, setMode, toggleMode, mounted };
}

// ── Shared theme tokens ────────────────────────────────────────
export const themeTokens = {
  obsidian: {
    bg: "#060009",
    accent: "#ff3d8b",
    secondary: "#bf5af2",
    tertiary: "#7b61ff",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,61,139,0.18)",
    cardGlow: "rgba(255,61,139,0.12)",
    textPrimary: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    textFaint: "rgba(255,255,255,0.20)",
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(255,61,139,0.25)",
    gradient: "linear-gradient(135deg,#ff3d8b,#bf5af2,#7b61ff)",
  },
  aether: {
    bg: "#f0ede8",
    accent: "#2563eb",
    secondary: "#7c3aed",
    tertiary: "#0891b2",
    cardBg: "rgba(255,255,255,0.75)",
    cardBorder: "rgba(37,99,235,0.15)",
    cardGlow: "rgba(37,99,235,0.08)",
    textPrimary: "#0f0a1a",
    textMuted: "rgba(15,10,26,0.50)",
    textFaint: "rgba(15,10,26,0.25)",
    inputBg: "rgba(255,255,255,0.8)",
    inputBorder: "rgba(37,99,235,0.25)",
    gradient: "linear-gradient(135deg,#2563eb,#7c3aed,#0891b2)",
  },
} as const;