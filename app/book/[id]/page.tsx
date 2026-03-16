"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserBook } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

type GoogleBook = {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string; extraLarge?: string; large?: string; medium?: string };
    categories?: string[];
    pageCount?: number;
    averageRating?: number;
    ratingsCount?: number;
    publishedDate?: string;
    publisher?: string;
    language?: string;
  };
};

const STATUSES: { value: UserBook["status"]; label: string; emoji: string }[] = [
  { value: "reading",       label: "Reading",       emoji: "📖" },
  { value: "want_to_read",  label: "Want to Read",  emoji: "🔖" },
  { value: "finished",      label: "Finished",      emoji: "✦" },
  { value: "dnf",           label: "Did Not Finish", emoji: "✕" },
];

const TROPE_TAGS = [
  "Dark Romance", "Enemies to Lovers", "Forbidden Love", "Morally Grey",
  "Slow Burn", "Found Family", "Redemption Arc", "Age Gap",
  "Fantasy", "Thriller", "Self-Growth", "Literary Fiction",
  "Second Chance", "Antihero", "Hurt/Comfort",
];

const VIBE_TAGS = [
  "Obsessed 🖤", "Haunting 🌙", "Addictive ✦", "Devastating 💔",
  "Empowering 🔥", "Cozy ☕", "Mind-bending 🌀", "Sentimental 🌸",
];

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";
  const router = useRouter();

  const [book, setBook] = useState<GoogleBook | null>(null);
  const [userBook, setUserBook] = useState<UserBook | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [status, setStatus] = useState<UserBook["status"]>("want_to_read");
  const [rating, setRating] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [selectedTropes, setSelectedTropes] = useState<string[]>([]);
  const [vibeTag, setVibeTag] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Fetch Google Books data
  useEffect(() => {
    if (!id) return;
    fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
      .then(r => r.json())
      .then(data => { setBook(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch existing user_book entry
  useEffect(() => {
    if (!userId || !id) return;
    supabase
      .from("user_books")
      .select("*")
      .eq("user_id", userId)
      .eq("google_book_id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserBook(data);
          setStatus(data.status);
          setRating(data.rating ?? 0);
          setProgress(data.progress ?? 0);
          setNote(data.note ?? "");
          setSelectedTropes(data.trope_tags ?? []);
          setVibeTag(data.vibe_tag ?? null);
        }
      });
  }, [userId, id]);

  const toggleTrope = (tag: string) => {
    setSelectedTropes(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!userId) { router.push("/login"); return; }
    if (!book) return;
    setSaving(true);
    const v = book.volumeInfo;

    const payload = {
      user_id: userId,
      google_book_id: id,
      title: v.title,
      author: v.authors?.[0] ?? "Unknown",
      cover_url: v.imageLinks?.thumbnail ?? null,
      status,
      rating: rating || null,
      progress,
      note: note || null,
      trope_tags: selectedTropes,
      vibe_tag: vibeTag,
      ...(status === "finished" && !userBook?.finished_at ? { finished_at: new Date().toISOString() } : {}),
    };

    const { error } = await supabase
      .from("user_books")
      .upsert(payload, { onConflict: "user_id,google_book_id" });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleRemove = async () => {
    if (!userId || !userBook) return;
    await supabase.from("user_books").delete().eq("id", userBook.id);
    router.push("/my-books");
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: `${t.accent}44`, borderTopColor: t.accent }}
        />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: t.bg }}>
        <p className="text-2xl font-black" style={{ color: t.textPrimary }}>Book not found.</p>
        <Link href="/search" className="text-sm underline" style={{ color: t.accent }}>Back to search</Link>
      </div>
    );
  }

  const v = book.volumeInfo;
  const cover = v.imageLinks?.extraLarge ?? v.imageLinks?.large ?? v.imageLinks?.medium ?? v.imageLinks?.thumbnail;
  const description = v.description?.replace(/<[^>]*>/g, "") ?? "";

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily: "'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>
      <Navbar />

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw', borderRadius: '50%',
          background: `radial-gradient(circle, ${t.accent}12 0%, transparent 70%)`,
          top: '-20vw', left: '-15vw', filter: 'blur(60px)',
        }} />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-24">
        {/* Back */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 mb-10 text-sm transition-opacity hover:opacity-70"
          style={{ fontFamily: "'Syne', sans-serif", color: t.textFaint, letterSpacing: "0.15em" }}
        >
          ← Back to Search
        </Link>

        <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start">
          {/* LEFT: Cover + quick stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="rounded-3xl overflow-hidden mb-6 aspect-[2/3]"
              style={{
                background: `linear-gradient(135deg, ${t.accent}44, ${t.secondary}44)`,
                boxShadow: `0 30px 80px ${t.accent}33`,
              }}
            >
              {cover ? (
                <img src={cover} alt={v.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
              )}
            </div>

            {/* Book meta */}
            <div className="space-y-3">
              {[
                { label: "Pages", value: v.pageCount ? `${v.pageCount} pages` : "—" },
                { label: "Published", value: v.publishedDate?.slice(0, 4) ?? "—" },
                { label: "Publisher", value: v.publisher ?? "—" },
                { label: "Category", value: v.categories?.[0] ?? "—" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: t.textFaint }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: t.textMuted, fontStyle: "italic" }}>
                    {item.value}
                  </span>
                </div>
              ))}
              {v.averageRating && (
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: t.textFaint }}>
                    GoodReads
                  </span>
                  <span className="text-sm font-bold" style={{ color: t.accent }}>
                    ★ {v.averageRating} ({v.ratingsCount?.toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Info + edit panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            {/* Title & author */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight" style={{ color: t.textPrimary }}>
                {v.title}
              </h1>
              <p className="text-xl italic" style={{ color: t.textMuted }}>
                by {v.authors?.join(", ") ?? "Unknown"}
              </p>
            </div>

            {/* Description */}
            {description && (
              <div
                className="rounded-2xl p-6 mb-8 border"
                style={{ background: t.cardBg, borderColor: t.cardBorder, backdropFilter: "blur(12px)" }}
              >
                <p className="text-base leading-relaxed line-clamp-5 italic" style={{ color: t.textMuted }}>
                  {description}
                </p>
              </div>
            )}

            {/* ── STATUS ── */}
            <Section label="Reading Status" accent={t.accent}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      background: status === s.value ? t.gradient : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
                      color: status === s.value ? "#fff" : t.textMuted,
                      boxShadow: status === s.value ? `0 4px 20px ${t.accent}44` : "none",
                    }}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* ── RATING ── */}
            <Section label="Your Rating" accent={t.accent}>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="text-3xl transition-all hover:scale-110"
                    style={{ opacity: star <= rating ? 1 : 0.25 }}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm self-center font-bold" style={{ fontFamily: "'Syne', sans-serif", color: t.accent }}>
                    {["", "Meh", "Okay", "Liked it", "Loved it", "Life-changing"][rating]}
                  </span>
                )}
              </div>
            </Section>

            {/* ── PROGRESS ── */}
            {status === "reading" && (
              <Section label={`Progress — ${progress}%`} accent={t.accent}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: t.accent }}
                />
              </Section>
            )}

            {/* ── TROPE TAGS ── */}
            <Section label={isDark ? "Trope Tags" : "Genre Tags"} accent={t.accent}>
              <div className="flex flex-wrap gap-2">
                {TROPE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTrope(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all"
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      background: selectedTropes.includes(tag) ? t.accent : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
                      color: selectedTropes.includes(tag) ? "#fff" : t.textMuted,
                      border: `1px solid ${selectedTropes.includes(tag) ? t.accent : "transparent"}`,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Section>

            {/* ── VIBE TAG ── */}
            <Section label="Vibe" accent={t.accent}>
              <div className="flex flex-wrap gap-2">
                {VIBE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setVibeTag(vibeTag === tag ? null : tag)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      background: vibeTag === tag ? t.secondary : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
                      color: vibeTag === tag ? "#fff" : t.textMuted,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Section>

            {/* ── NOTE ── */}
            <Section label={isDark ? "Dark Thoughts" : "Your Notes"} accent={t.accent}>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                placeholder={isDark ? "What did this book do to you..." : "What did you take away from this..."}
                className="w-full px-5 py-4 rounded-2xl outline-none resize-none transition-all"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.textPrimary,
                }}
              />
            </Section>

            {/* ── ACTIONS ── */}
            <div className="flex gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white transition-all"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  background: saved ? t.secondary : (saving ? t.textFaint : t.gradient),
                  boxShadow: saving || saved ? "none" : `0 8px 32px ${t.accent}44`,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : saved ? "✓ Saved!" : userBook ? "Update Book" : "Add to Library"}
              </motion.button>

              {userBook && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRemove}
                  className="px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider border transition-all"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    color: t.textMuted,
                  }}
                >
                  Remove
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function Section({ label, children, accent }: { label: string; children: React.ReactNode; accent: string }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-px" style={{ background: accent }} />
        <span
          className="text-xs uppercase tracking-[0.3em] font-semibold"
          style={{ fontFamily: "'Syne', sans-serif", color: accent }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}