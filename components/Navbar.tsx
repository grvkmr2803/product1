"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const { mode, toggleMode } = useTheme();
  const t = themeTokens[mode];
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const isDark = mode === "obsidian";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = user
    ? [
        { href: "/my-books",   label: isDark ? "My Obsessions" : "My Library" },
        { href: "/search",     label: "Search"    },
        { href: "/community",  label: "Community" },
        { href: "/profile",    label: "Profile"   },
      ]
    : [
        { href: "/search",    label: "Search"    },
        { href: "/community", label: "Community" },
        { href: "/login",     label: "Login"     },
      ];

  // Gradient text — use a className approach to avoid inline background+backgroundClip conflict
  const gradientStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.25rem",
    fontWeight: 900,
    letterSpacing: "0.15em",
    // Use -webkit-text-fill-color + backgroundImage instead of background + backgroundClip
    backgroundImage: t.gradient,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    // Do NOT set "background" or "color" here — that's what caused the conflict
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: isDark ? "rgba(6,0,9,0.85)" : "rgba(240,237,232,0.85)",
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/">
          <motion.div whileHover={{ scale: 1.03 }} className="flex flex-col leading-none cursor-pointer">
            {/* Key fix: no "background" shorthand — only backgroundImage + backgroundClip */}
            <span style={gradientStyle}>
              {isDark ? "OBSIDIAN" : "AETHER"}
            </span>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.4em",
                color: t.textFaint,
                marginTop: 2,
              }}
            >
              {isDark ? "dark archive" : "reading legacy"}
            </span>
          </motion.div>
        </Link>

        {/* ── Nav links ── */}
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                fontWeight: 600,
                color: pathname === link.href ? t.accent : t.textFaint,
                transition: "color 0.2s",
              }}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <button
              onClick={handleLogout}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                fontWeight: 600,
                color: t.textFaint,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          )}

          {/* ── Theme toggle ── */}
          <button
            onClick={toggleMode}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "9999px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
              color: t.textMuted,
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {isDark ? "✦ Light" : "✦ Dark"}
          </button>
        </div>
      </div>
    </nav>
  );
}