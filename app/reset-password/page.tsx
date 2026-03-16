"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

export default function ResetPasswordPage() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Supabase sends the user here with a session already set via URL hash
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User is now in password recovery mode — form is ready
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/my-books"), 2000);
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
              Set New Password
            </h1>
            <p className="italic text-lg" style={{ color: t.textMuted }}>Choose something you'll remember.</p>
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-[2rem] p-10 border text-center"
              style={{ background: t.cardBg, borderColor: t.cardBorder }}
            >
              <div className="text-5xl mb-4">✦</div>
              <p className="text-xl font-black mb-2" style={{ color: t.textPrimary }}>Password updated!</p>
              <p className="italic" style={{ color: t.textMuted }}>Redirecting you to your library...</p>
            </motion.div>
          ) : (
            <div className="rounded-[2rem] p-8 border"
              style={{ background: t.cardBg, borderColor: t.cardBorder, backdropFilter: "blur(24px)" }}>
              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { label: "New Password", value: password, onChange: setPassword },
                  { label: "Confirm Password", value: confirm, onChange: setConfirm },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs uppercase tracking-widest mb-2 font-semibold"
                      style={{ fontFamily: "'Syne', sans-serif", color: t.textMuted }}>
                      {field.label}
                    </label>
                    <input type="password" required value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 rounded-2xl outline-none text-base"
                      style={{ fontFamily: "'Playfair Display', serif", background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
                    />
                  </div>
                ))}

                {error && (
                  <p className="text-sm px-4 py-3 rounded-xl"
                    style={{ background: `${t.accent}18`, color: t.accent, fontFamily: "'Syne', sans-serif" }}>
                    {error}
                  </p>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white text-sm"
                  style={{ fontFamily: "'Syne', sans-serif", background: loading ? t.textFaint : t.gradient, boxShadow: `0 8px 32px ${t.accent}44` }}>
                  {loading ? "Updating..." : "Update Password ✦"}
                </motion.button>
              </form>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
