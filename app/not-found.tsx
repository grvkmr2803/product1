"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme, themeTokens } from "@/hooks/useTheme";

export default function NotFound() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode ?? "obsidian"];
  const isDark = mode === "obsidian";

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: t.bg, fontFamily: "'Playfair Display', serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${t.accent}12 0%, transparent 70%)`,
          top: '20%', left: '20%', filter: 'blur(80px)',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-[120px] leading-none mb-6 select-none"
        >
          {isDark ? "🌙" : "📚"}
        </motion.div>

        <h1
          className="text-8xl font-black tracking-tight mb-4"
          style={{
            background: t.gradient,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          404
        </h1>

        <h2 className="text-3xl font-black mb-4 italic" style={{ color: t.textPrimary }}>
          {isDark ? "This page disappeared into the dark." : "This page doesn't exist."}
        </h2>

        <p className="text-lg italic max-w-md mx-auto mb-10" style={{ color: t.textMuted }}>
          {isDark
            ? "Some chapters are never written. This is one of them."
            : "The page you're looking for has turned its last page."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm cursor-pointer"
              style={{ fontFamily: "'Syne', sans-serif", background: t.gradient, boxShadow: `0 8px 32px ${t.accent}44` }}>
              Go Home
            </motion.div>
          </Link>
          <Link href="/search">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-full font-bold uppercase tracking-widest text-sm cursor-pointer border"
              style={{
                fontFamily: "'Syne', sans-serif",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                color: t.textMuted,
              }}>
              Search Books
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}