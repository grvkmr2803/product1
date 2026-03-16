"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

type Tab = "login" | "signup";

export default function LoginPage() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.push("/my-books");
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/my-books");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError("Username is required"); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess("Check your email to confirm your account ✦");
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/my-books` },
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily: "'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>
      <Navbar />

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${t.accent}18 0%, transparent 70%)`,
          top: '-20vw', left: '-10vw', filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${t.secondary}12 0%, transparent 70%)`,
          bottom: '10vw', right: '-5vw', filter: 'blur(40px)',
        }} />
      </div>

      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1
              className="text-5xl font-black tracking-tight mb-3"
              style={{ color: t.textPrimary }}
            >
              {tab === "login" ? (
                isDark ? "Welcome back, darkness." : "Welcome back."
              ) : (
                isDark ? "Begin your descent." : "Start your thread."
              )}
            </h1>
            <p className="italic text-lg" style={{ color: t.textMuted }}>
              {tab === "login"
                ? "Your obsessions missed you."
                : isDark ? "Every dark archive starts with one book." : "Every legacy starts with one chapter."}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-2xl p-1 mb-8"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
          >
            {(["login", "signup"] as Tab[]).map((t_) => (
              <button
                key={t_}
                onClick={() => { setTab(t_); setError(null); setSuccess(null); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  background: tab === t_ ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)") : "transparent",
                  color: tab === t_ ? t.accent : t.textFaint,
                  boxShadow: tab === t_ ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {t_ === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Card */}
          <div
            className="rounded-[2rem] p-8 border"
            style={{
              background: t.cardBg,
              borderColor: t.cardBorder,
              boxShadow: `0 30px 80px ${t.cardGlow}`,
              backdropFilter: "blur(24px)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                onSubmit={tab === "login" ? handleLogin : handleSignup}
                className="space-y-5"
              >
                {tab === "signup" && (
                  <InputField
                    label="Username"
                    type="text"
                    value={username}
                    onChange={setUsername}
                    placeholder={isDark ? "your_dark_alias" : "your_name"}
                    accent={t.accent}
                    textPrimary={t.textPrimary}
                    textMuted={t.textMuted}
                    inputBg={t.inputBg}
                    inputBorder={t.inputBorder}
                    isDark={isDark}
                  />
                )}

                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="your@email.com"
                  accent={t.accent}
                  textPrimary={t.textPrimary}
                  textMuted={t.textMuted}
                  inputBg={t.inputBg}
                  inputBorder={t.inputBorder}
                  isDark={isDark}
                />

                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  accent={t.accent}
                  textPrimary={t.textPrimary}
                  textMuted={t.textMuted}
                  inputBg={t.inputBg}
                  inputBorder={t.inputBorder}
                  isDark={isDark}
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{ background: `${t.accent}18`, color: t.accent, fontFamily: "'Syne', sans-serif" }}
                  >
                    {error}
                  </motion.p>
                )}

                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{ background: `${t.secondary}18`, color: t.secondary, fontFamily: "'Syne', sans-serif" }}
                  >
                    {success}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white text-sm transition-all"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    background: loading ? t.textFaint : t.gradient,
                    boxShadow: loading ? "none" : `0 8px 32px ${t.accent}44`,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "..." : tab === "login" ? "Sign In ✦" : "Create Account ✦"}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, color: t.textFaint, letterSpacing: "0.2em" }}>OR</span>
              <div className="flex-1 h-px" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
            </div>

            {/* Google */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogle}
              className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 border transition-all"
              style={{
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.1em",
                background: t.inputBg,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                color: t.textPrimary,
              }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ── Reusable input ─────────────────────────────────────────────
function InputField({
  label, type, value, onChange, placeholder,
  accent, textPrimary, textMuted, inputBg, inputBorder, isDark,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; accent: string; textPrimary: string; textMuted: string;
  inputBg: string; inputBorder: string; isDark: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block text-xs uppercase tracking-widest mb-2 font-semibold"
        style={{ fontFamily: "'Syne', sans-serif", color: focused ? accent : textMuted }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        className="w-full px-5 py-4 rounded-2xl outline-none transition-all duration-200 text-base"
        style={{
          fontFamily: "'Playfair Display', serif",
          background: inputBg,
          border: `1px solid ${focused ? accent : inputBorder}`,
          color: textPrimary,
          boxShadow: focused ? `0 0 0 3px ${accent}18` : "none",
        }}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}