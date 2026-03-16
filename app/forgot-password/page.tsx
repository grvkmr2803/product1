"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily: "'Playfair Display', serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>
      <Navbar />

      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: t.textPrimary }}>
              {isDark ? "Lost in the dark?" : "Forgot your password?"}
            </h1>
            <p className="italic text-lg" style={{ color: t.textMuted }}>
              We'll send you a link to find your way back.
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[2rem] p-10 border text-center"
              style={{ background: t.cardBg, borderColor: t.cardBorder }}
            >
              <div className="text-5xl mb-4">✉️</div>
              <p className="text-xl font-black mb-2" style={{ color: t.textPrimary }}>Check your inbox</p>
              <p className="italic mb-6" style={{ color: t.textMuted }}>
                We sent a reset link to <strong>{email}</strong>
              </p>
              <Link href="/login"
                className="text-sm font-semibold underline"
                style={{ fontFamily: "'Syne', sans-serif", color: t.accent }}
              >
                Back to Login
              </Link>
            </motion.div>
          ) : (
            <div
              className="rounded-[2rem] p-8 border"
              style={{ background: t.cardBg, borderColor: t.cardBorder, backdropFilter: "blur(24px)" }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2 font-semibold"
                    style={{ fontFamily: "'Syne', sans-serif", color: t.textMuted }}>
                    Email Address
                  </label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-5 py-4 rounded-2xl outline-none text-base transition-all"
                    style={{ fontFamily: "'Playfair Display', serif", background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
                  />
                </div>

                {error && (
                  <p className="text-sm px-4 py-3 rounded-xl" style={{ background: `${t.accent}18`, color: t.accent, fontFamily: "'Syne', sans-serif" }}>
                    {error}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white text-sm"
                  style={{ fontFamily: "'Syne', sans-serif", background: loading ? t.textFaint : t.gradient, boxShadow: `0 8px 32px ${t.accent}44` }}
                >
                  {loading ? "Sending..." : "Send Reset Link ✦"}
                </motion.button>

                <div className="text-center pt-2">
                  <Link href="/login"
                    className="text-xs uppercase tracking-widest font-semibold"
                    style={{ fontFamily: "'Syne', sans-serif", color: t.textFaint }}
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}