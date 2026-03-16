"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserBook } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";
import LifeThread from "@/components/LifeThread";

type FilterStatus = "all" | UserBook["status"];
type SortBy = "added_at" | "title" | "rating" | "finished_at";
type ViewMode = "grid" | "thread";

const STATUS_LABELS: Record<FilterStatus, string> = {
  all: "All",
  reading: "Reading",
  want_to_read: "Want to Read",
  finished: "Finished",
  dnf: "DNF",
};

const STATUS_EMOJI: Record<string, string> = {
  reading: "📖",
  want_to_read: "🔖",
  finished: "✦",
  dnf: "✕",
};

export default function MyBooksPage() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";
  const router = useRouter();

  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("added_at");
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("Reader");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("username").eq("id", userId).single()
      .then(({ data }) => { if (data) setUsername(data.username); });

    supabase.from("user_books").select("*").eq("user_id", userId)
      .order("added_at", { ascending: false })
      .then(({ data }) => { setBooks(data ?? []); setLoading(false); });
  }, [userId]);

  const deleteBook = async (id: string) => {
    setDeletingId(id);
    await supabase.from("user_books").delete().eq("id", id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
  };

  const filtered = books
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "title")       return a.title.localeCompare(b.title);
      if (sortBy === "rating")      return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === "finished_at") return (b.finished_at ?? "").localeCompare(a.finished_at ?? "");
      return b.added_at.localeCompare(a.added_at);
    });

  const stats = {
    total: books.length,
    finished: books.filter(b => b.status === "finished").length,
    reading: books.filter(b => b.status === "reading").length,
    avgRating: books.filter(b => b.rating).length
      ? (books.filter(b => b.rating).reduce((a, b) => a + (b.rating ?? 0), 0) /
         books.filter(b => b.rating).length).toFixed(1)
      : "—",
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-t-transparent"
          style={{ borderColor: `${t.accent}44`, borderTopColor: t.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily: "'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>
      <Navbar />

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:'absolute', width:'60vw', height:'60vw', borderRadius:'50%', background:`radial-gradient(circle,${t.accent}12 0%,transparent 70%)`, top:'-20vw', right:'-10vw', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', width:'40vw', height:'40vw', borderRadius:'50%', background:`radial-gradient(circle,${t.secondary}10 0%,transparent 70%)`, bottom:'5vw', left:'-5vw', filter:'blur(50px)' }} />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-24">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }} className="mb-10">
          <span className="text-xs uppercase tracking-[0.4em] font-semibold block mb-4"
            style={{ fontFamily:"'Syne',sans-serif", color:t.accent }}>
            {isDark ? `${username}'s Dark Archive` : `${username}'s Reading Life`}
          </span>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight" style={{ color:t.textPrimary }}>
              {isDark ? "My Obsessions" : "My Library"}
            </h1>

            {/* ── VIEW TOGGLE ── */}
            <div className="flex items-center gap-2 p-1 rounded-2xl border"
              style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
              {([
                { key: "grid",   icon: "▦", label: "Grid"   },
                { key: "thread", icon: "⟡", label: isDark ? "Thread" : "Timeline" },
              ] as { key: ViewMode; icon: string; label: string }[]).map(v => (
                <button key={v.key} onClick={() => setViewMode(v.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    background: viewMode === v.key
                      ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)")
                      : "transparent",
                    color: viewMode === v.key ? t.accent : t.textFaint,
                    boxShadow: viewMode === v.key ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
                  }}>
                  <span>{v.icon}</span> {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-8">
            {[
              { label:"Total Books",  value:stats.total,      color:t.accent    },
              { label:"Finished",     value:stats.finished,   color:t.secondary },
              { label:"Reading Now",  value:stats.reading,    color:t.tertiary  },
              { label:"Avg Rating",   value:`★ ${stats.avgRating}`, color:t.accent },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black" style={{ color:s.color }}>{s.value}</div>
                <div className="text-xs uppercase tracking-widest mt-1" style={{ fontFamily:"'Syne',sans-serif", color:t.textFaint }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CONTROLS (grid mode only) ── */}
        <AnimatePresence>
          {viewMode === "grid" && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              transition={{ duration:0.3 }} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border flex-1"
                  style={{ background:t.cardBg, borderColor:t.inputBorder, backdropFilter:"blur(12px)" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color:t.textFaint, flexShrink:0 }}>
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="m12 12 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search your books..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ fontFamily:"'Playfair Display',serif", color:t.textPrimary }} />
                </div>

                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
                  className="px-5 py-3 rounded-2xl border text-sm font-semibold outline-none cursor-pointer"
                  style={{ fontFamily:"'Syne',sans-serif", background:t.cardBg, borderColor:t.inputBorder, color:t.textMuted, backdropFilter:"blur(12px)" }}>
                  <option value="added_at">Recently Added</option>
                  <option value="title">Title A-Z</option>
                  <option value="rating">Highest Rated</option>
                  <option value="finished_at">Recently Finished</option>
                </select>

                <Link href="/search">
                  <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider text-white cursor-pointer"
                    style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient, boxShadow:`0 4px 20px ${t.accent}44` }}>
                    + Add Book
                  </motion.div>
                </Link>
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-2 flex-wrap mb-8">
                {(Object.keys(STATUS_LABELS) as FilterStatus[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      fontFamily:"'Syne',sans-serif",
                      background: filter === f ? t.accent : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
                      color: filter === f ? "#fff" : t.textMuted,
                      boxShadow: filter === f ? `0 4px 16px ${t.accent}44` : "none",
                    }}>
                    {f !== "all" && `${STATUS_EMOJI[f]} `}{STATUS_LABELS[f]}
                    {f !== "all" && <span className="ml-1.5 opacity-70">({books.filter(b => b.status === f).length})</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EMPTY STATE ── */}
        {books.length === 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-32">
            <div className="text-6xl mb-6">{isDark ? "🌙" : "📚"}</div>
            <h2 className="text-2xl font-black mb-3 italic" style={{ color:t.textPrimary }}>
              {isDark ? "Your archive is empty." : "Your library is empty."}
            </h2>
            <p className="mb-8 italic" style={{ color:t.textMuted }}>Start adding books you love.</p>
            <Link href="/search">
              <motion.div whileHover={{ scale:1.04 }}
                className="inline-block px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm"
                style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient, boxShadow:`0 8px 32px ${t.accent}44` }}>
                {isDark ? "Find Your First Obsession" : "Add Your First Book"}
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── THREAD VIEW ── */}
        <AnimatePresence mode="wait">
          {viewMode === "thread" && books.length > 0 && (
            <motion.div key="thread" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }}>
              <LifeThread books={filtered.length > 0 ? filtered : books} mode={mode} />
            </motion.div>
          )}

          {/* ── GRID VIEW ── */}
          {viewMode === "grid" && (
            <motion.div key="grid" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }}>
              {filtered.length === 0 && books.length > 0 && (
                <div className="text-center py-20">
                  <p className="text-lg italic" style={{ color:t.textMuted }}>No books match this filter.</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered.map((book, i) => (
                  <motion.div key={book.id} layout
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:i*0.03, duration:0.4 }}
                    className="group">
                    <Link href={`/book/${book.google_book_id}`} className="block">
                      <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[2/3]"
                        style={{ background:`linear-gradient(135deg,${t.accent}33,${t.secondary}33)`, boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
                        {book.cover_url ? (
                          <img src={book.cover_url.replace("http://","https://")} alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                        )}
                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                          style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
                          {STATUS_EMOJI[book.status]}
                        </div>
                        {book.rating && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background:"rgba(0,0,0,0.75)", color:t.accent, fontFamily:"'Syne',sans-serif" }}>
                            ★ {book.rating}
                          </div>
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3"
                          style={{ background:"linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)" }}>
                          <span className="text-white text-xs font-semibold" style={{ fontFamily:"'Syne',sans-serif" }}>Edit →</span>
                        </div>
                      </div>
                    </Link>

                    {book.status === "reading" && book.progress > 0 && (
                      <div className="h-1 rounded-full mb-2 overflow-hidden" style={{ background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)" }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${book.progress}%` }} transition={{ duration:0.8 }}
                          className="h-full rounded-full" style={{ background:t.accent }} />
                      </div>
                    )}

                    <h3 className="font-black text-sm leading-tight mb-1 line-clamp-2" style={{ color:t.textPrimary }}>{book.title}</h3>
                    <p className="text-xs mb-2 line-clamp-1 italic" style={{ color:t.textMuted }}>{book.author}</p>

                    {book.trope_tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {book.trope_tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                            style={{ fontFamily:"'Syne',sans-serif", background:`${t.accent}18`, color:t.accent }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <button onClick={() => deleteBook(book.id)} disabled={deletingId === book.id}
                      className="mt-2 text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                      style={{ fontFamily:"'Syne',sans-serif", color:t.textFaint }}>
                      {deletingId === book.id ? "..." : "Remove"}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}