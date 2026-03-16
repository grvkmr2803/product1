"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserBook } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

const ARCHETYPES = [
  { id: "villain",     label: "The Villain",     emoji: "🖤", desc: "Drawn to the dark, the morally grey, the ones who break rules." },
  { id: "romantic",    label: "The Romantic",     emoji: "🌹", desc: "Lives for slow burns, heart-wrenching love, and happy endings." },
  { id: "philosopher", label: "The Philosopher",  emoji: "🌀", desc: "Seeks meaning, questions everything, lives in the ideas." },
  { id: "adventurer",  label: "The Adventurer",   emoji: "⚔️", desc: "Fantasy worlds, epic quests, found family and chosen destiny." },
  { id: "empath",      label: "The Empath",       emoji: "🌸", desc: "Feels every character deeply, cries at the good parts." },
  { id: "stoic",       label: "The Stoic",        emoji: "🪨", desc: "Calm, analytical, reads to understand the human condition." },
  { id: "rebel",       label: "The Rebel",        emoji: "⚡", desc: "Antiheroes, dystopias, anyone who burns the system down." },
  { id: "dreamer",     label: "The Dreamer",      emoji: "✨", desc: "Magical realism, whimsy, stories that feel like a warm dream." },
];

export default function ProfilePage() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId]       = useState<string | null>(null);
  const [username, setUsername]   = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [books, setBooks]         = useState<UserBook[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "stats">("edit");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_books").select("*").eq("user_id", userId),
    ]).then(([{ data: profile }, { data: booksData }]) => {
      if (profile) {
        setUsername(profile.username ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
        setArchetype(profile.archetype ?? null);
      }
      setBooks(booksData ?? []);
      setLoading(false);
    });
  }, [userId]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    }
    setAvatarUploading(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    if (username.trim().length < 2) { setUsernameError("At least 2 characters"); return; }
    if (username.trim().length > 30) { setUsernameError("Under 30 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) { setUsernameError("Only letters, numbers, underscores"); return; }
    setSaving(true); setUsernameError(null);
    await supabase.from("profiles").update({ username: username.trim(), archetype }).eq("id", userId);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const stats = {
    total:      books.length,
    finished:   books.filter(b => b.status === "finished").length,
    reading:    books.filter(b => b.status === "reading").length,
    wantToRead: books.filter(b => b.status === "want_to_read").length,
    avgRating: books.filter(b => b.rating).length
      ? (books.filter(b => b.rating).reduce((a, b) => a + (b.rating ?? 0), 0) / books.filter(b => b.rating).length).toFixed(1)
      : null,
    topTropes: (() => {
      const counts: Record<string, number> = {};
      books.forEach(b => b.trope_tags?.forEach(tag => { counts[tag] = (counts[tag] ?? 0) + 1; }));
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    })(),
    ratingDist: [5,4,3,2,1].map(star => ({ star, count: books.filter(b => b.rating === star).length })),
    recentlyFinished: books.filter(b => b.status === "finished" && b.finished_at)
      .sort((a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? "")).slice(0, 4),
    byYear: (() => {
      const y: Record<string, number> = {};
      books.forEach(b => { const yr = new Date(b.added_at).getFullYear().toString(); y[yr] = (y[yr] ?? 0) + 1; });
      return Object.entries(y).sort((a, b) => a[0].localeCompare(b[0]));
    })(),
  };

  const maxYearCount = Math.max(...stats.byYear.map(([,c]) => c), 1);
  const selectedArchetype = ARCHETYPES.find(a => a.id === archetype);

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .float-anim { animation: float 6s ease-in-out infinite; }
      `}</style>
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:"absolute", width:"60vw", height:"60vw", borderRadius:"50%", background:`radial-gradient(circle,${t.accent}12 0%,transparent 70%)`, top:"-15vw", right:"-10vw", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", borderRadius:"50%", background:`radial-gradient(circle,${t.secondary}10 0%,transparent 70%)`, bottom:"10vw", left:"-5vw", filter:"blur(50px)" }} />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 pt-12 pb-24">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
          className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="float-anim" style={{ display:"inline-block" }}>
              <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-2 relative cursor-pointer group"
                style={{ borderColor:t.accent, boxShadow:`0 0 40px ${t.accent}44` }}
                onClick={() => fileRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-black"
                    style={{ backgroundImage:`linear-gradient(135deg,${t.accent}33,${t.secondary}33)`, color:t.accent }}>
                    {username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{ background:"rgba(0,0,0,0.6)" }}>
                  {avatarUploading
                    ? <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:"linear" }} className="w-6 h-6 rounded-full border-2 border-t-transparent" style={{ borderColor:`${t.accent}44`, borderTopColor:t.accent }} />
                    : <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"#fff", letterSpacing:"0.2em", textTransform:"uppercase" }}>Change</span>
                  }
                </div>
              </div>
            </div>
            {selectedArchetype && (
              <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", delay:0.3 }}
                className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                style={{ background:t.bg, borderColor:t.accent, boxShadow:`0 4px 16px ${t.accent}44` }}>
                {selectedArchetype.emoji}
              </motion.div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name + stats */}
          <div className="flex-1 text-center md:text-left">
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, textTransform:"uppercase", letterSpacing:"0.4em", color:t.accent }}>
              {isDark ? "Dark Archive" : "Reading Profile"}
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2 mb-2" style={{ color:t.textPrimary }}>
              @{username || "your_name"}
            </h1>
            {selectedArchetype && (
              <p className="text-lg italic mb-4" style={{ color:t.textMuted }}>{selectedArchetype.emoji} {selectedArchetype.label}</p>
            )}
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              {[
                { label:"Books",    val:stats.total,    color:t.accent    },
                { label:"Finished", val:stats.finished, color:t.secondary },
                { label:"Reading",  val:stats.reading,  color:t.tertiary  },
                ...(stats.avgRating ? [{ label:"Avg Rating", val:`★ ${stats.avgRating}`, color:t.accent }] : []),
              ].map(s => (
                <div key={s.label} className="text-center md:text-left">
                  <div className="text-2xl font-black" style={{ color:s.color }}>{s.val}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"0.3em", color:t.textFaint }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-10 w-fit border"
          style={{ background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", borderColor:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)" }}>
          {(["edit","stats"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                fontFamily:"'Syne',sans-serif",
                background: activeTab===tab ? (isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.9)") : "transparent",
                color: activeTab===tab ? t.accent : t.textFaint,
                boxShadow: activeTab===tab ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
              }}>
              {tab === "edit" ? "Edit Profile" : "My Stats"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── EDIT TAB ── */}
          {activeTab === "edit" && (
            <motion.div key="edit" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }} transition={{ duration:0.35 }}
              className="space-y-8">

              <SectionBlock label="Username" accent={t.accent} textFaint={t.textFaint}>
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border"
                  style={{ background:t.inputBg, borderColor:usernameError?t.accent:t.inputBorder }}>
                  <span style={{ color:t.textFaint, fontFamily:"'Syne',sans-serif" }}>@</span>
                  <input type="text" value={username} onChange={e => { setUsername(e.target.value); setUsernameError(null); }}
                    placeholder="your_username" className="flex-1 bg-transparent outline-none text-lg"
                    style={{ fontFamily:"'Playfair Display',serif", color:t.textPrimary }} />
                </div>
                {usernameError && <p className="text-xs mt-2 px-1" style={{ color:t.accent, fontFamily:"'Syne',sans-serif" }}>{usernameError}</p>}
                <p className="text-xs mt-2 px-1 italic" style={{ color:t.textFaint }}>Letters, numbers, underscores only. 2–30 chars.</p>
              </SectionBlock>

              <SectionBlock label={isDark?"Your Archetype":"Reader Archetype"} accent={t.accent} textFaint={t.textFaint}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ARCHETYPES.map(a => (
                    <motion.button key={a.id} whileHover={{ y:-3 }} whileTap={{ scale:0.97 }}
                      onClick={() => setArchetype(archetype===a.id ? null : a.id)}
                      className="p-4 rounded-2xl border text-left transition-all"
                      style={{
                        backgroundImage: archetype===a.id ? `linear-gradient(135deg,${t.accent}22,${t.secondary}22)` : "none",
                        background: archetype===a.id ? undefined : t.cardBg,
                        borderColor: archetype===a.id ? t.accent : t.cardBorder,
                        boxShadow: archetype===a.id ? `0 8px 32px ${t.accent}33` : "none",
                        backdropFilter:"blur(12px)",
                      }}>
                      <div className="text-2xl mb-2">{a.emoji}</div>
                      <div className="font-black text-sm mb-1" style={{ fontFamily:"'Syne',sans-serif", color:archetype===a.id?t.accent:t.textPrimary }}>{a.label}</div>
                      <div className="text-xs italic leading-relaxed" style={{ color:t.textMuted }}>{a.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </SectionBlock>

              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white text-sm"
                style={{
                  fontFamily:"'Syne',sans-serif",
                  backgroundImage: saved ? `linear-gradient(135deg,${t.secondary},${t.tertiary})` : (saving?"none":t.gradient),
                  background: saving ? t.textFaint : undefined,
                  boxShadow: saving||saved?"none":`0 8px 32px ${t.accent}44`,
                  cursor: saving?"not-allowed":"pointer",
                }}>
                {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile ✦"}
              </motion.button>
            </motion.div>
          )}

          {/* ── STATS TAB ── */}
          {activeTab === "stats" && (
            <motion.div key="stats" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }} transition={{ duration:0.35 }}
              className="space-y-8">

              {books.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📚</div>
                  <p className="text-xl font-black italic mb-3" style={{ color:t.textPrimary }}>No stats yet.</p>
                  <p className="italic mb-6" style={{ color:t.textMuted }}>Add some books to see your reading stats.</p>
                  <Link href="/search">
                    <motion.div whileHover={{ scale:1.04 }} className="inline-block px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm"
                      style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient, boxShadow:`0 8px 32px ${t.accent}44` }}>Find Books</motion.div>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Breakdown cards */}
                  <SectionBlock label="Library Breakdown" accent={t.accent} textFaint={t.textFaint}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label:"Total",        val:stats.total,      color:t.accent,    bg:`${t.accent}18`    },
                        { label:"Finished",     val:stats.finished,   color:t.secondary, bg:`${t.secondary}18` },
                        { label:"Reading",      val:stats.reading,    color:t.tertiary,  bg:`${t.tertiary}18`  },
                        { label:"Want to Read", val:stats.wantToRead, color:t.accent,    bg:`${t.accent}12`    },
                      ].map(s => (
                        <motion.div key={s.label} whileHover={{ y:-4 }} className="p-5 rounded-2xl border text-center"
                          style={{ background:s.bg, borderColor:`${s.color}33`, backdropFilter:"blur(12px)" }}>
                          <div className="text-4xl font-black mb-1" style={{ color:s.color }}>{s.val}</div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"0.3em", color:t.textFaint }}>{s.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </SectionBlock>

                  {/* Rating dist */}
                  {stats.avgRating && (
                    <SectionBlock label="Rating Distribution" accent={t.accent} textFaint={t.textFaint}>
                      <div className="rounded-2xl p-6 border" style={{ background:t.cardBg, borderColor:t.cardBorder, backdropFilter:"blur(12px)" }}>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-4xl font-black" style={{ color:t.accent }}>★ {stats.avgRating}</span>
                          <span className="italic text-lg" style={{ color:t.textMuted }}>average rating</span>
                        </div>
                        <div className="space-y-3">
                          {stats.ratingDist.map(({ star, count }) => {
                            const max = Math.max(...stats.ratingDist.map(r => r.count), 1);
                            return (
                              <div key={star} className="flex items-center gap-3">
                                <span className="text-xs w-16 text-right" style={{ color:t.accent }}>{"★".repeat(star)}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)" }}>
                                  <motion.div initial={{ width:0 }} animate={{ width:`${(count/max)*100}%` }}
                                    transition={{ duration:1, delay:star*0.1, ease:"easeOut" }}
                                    className="h-full rounded-full" style={{ backgroundImage:`linear-gradient(90deg,${t.accent},${t.secondary})` }} />
                                </div>
                                <span className="text-xs w-4" style={{ fontFamily:"'Syne',sans-serif", color:t.textFaint }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </SectionBlock>
                  )}

                  {/* Books per year bar chart */}
                  {stats.byYear.length > 0 && (
                    <SectionBlock label="Books Per Year" accent={t.accent} textFaint={t.textFaint}>
                      <div className="rounded-2xl p-6 border" style={{ background:t.cardBg, borderColor:t.cardBorder, backdropFilter:"blur(12px)" }}>
                        <div className="flex items-end gap-3 h-32">
                          {stats.byYear.map(([year, count]) => (
                            <div key={year} className="flex-1 flex flex-col items-center gap-2">
                              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:t.accent }}>{count}</span>
                              <motion.div initial={{ height:0 }} animate={{ height:`${(count/maxYearCount)*100}%` }}
                                transition={{ duration:1, ease:"easeOut" }}
                                className="w-full rounded-t-xl min-h-[4px]"
                                style={{ backgroundImage:`linear-gradient(to top,${t.accent},${t.secondary})`, maxHeight:"100%" }} />
                              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:9, color:t.textFaint, textTransform:"uppercase" }}>{year}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionBlock>
                  )}

                  {/* Top tropes */}
                  {stats.topTropes.length > 0 && (
                    <SectionBlock label={isDark?"Your Obsessions":"Top Genres"} accent={t.accent} textFaint={t.textFaint}>
                      <div className="space-y-3">
                        {stats.topTropes.map(([tag, count], i) => (
                          <motion.div key={tag} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}
                            className="flex items-center gap-4 p-4 rounded-2xl border"
                            style={{ background:t.cardBg, borderColor:t.cardBorder, backdropFilter:"blur(12px)" }}>
                            <span className="text-lg font-black w-6 text-right" style={{ color:t.textFaint, fontFamily:"'Syne',sans-serif" }}>{i+1}</span>
                            <div className="flex-1">
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)" }}>
                                <motion.div initial={{ width:0 }} animate={{ width:`${(count/stats.topTropes[0][1])*100}%` }}
                                  transition={{ duration:1, delay:i*0.1, ease:"easeOut" }}
                                  className="h-full rounded-full" style={{ backgroundImage:`linear-gradient(90deg,${t.accent},${t.secondary})` }} />
                              </div>
                            </div>
                            <span className="font-black text-sm" style={{ color:i===0?t.accent:t.textPrimary, fontFamily:"'Syne',sans-serif" }}>{tag}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:`${t.accent}18`, color:t.accent, fontFamily:"'Syne',sans-serif" }}>{count}</span>
                          </motion.div>
                        ))}
                      </div>
                    </SectionBlock>
                  )}

                  {/* Recently finished */}
                  {stats.recentlyFinished.length > 0 && (
                    <SectionBlock label="Recently Finished" accent={t.accent} textFaint={t.textFaint}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {stats.recentlyFinished.map(book => (
                          <Link key={book.id} href={`/book/${book.google_book_id}`}>
                            <motion.div whileHover={{ y:-4, scale:1.03 }} className="rounded-2xl overflow-hidden border cursor-pointer"
                              style={{ borderColor:t.cardBorder, boxShadow:`0 8px 24px ${t.cardGlow}` }}>
                              <div className="aspect-[2/3]" style={{ background:`linear-gradient(135deg,${t.accent}33,${t.secondary}33)` }}>
                                {book.cover_url
                                  ? <img src={book.cover_url.replace("http://","https://")} alt={book.title} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>}
                              </div>
                              <div className="p-3" style={{ background:t.cardBg, backdropFilter:"blur(12px)" }}>
                                <p className="font-black text-xs leading-tight line-clamp-2" style={{ color:t.textPrimary }}>{book.title}</p>
                                {book.rating && <p className="text-xs mt-1" style={{ color:t.accent }}>{"★".repeat(book.rating)}</p>}
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </SectionBlock>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SectionBlock({ label, children, accent, textFaint }: { label:string; children:React.ReactNode; accent:string; textFaint:string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-px" style={{ background:accent }} />
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, textTransform:"uppercase", letterSpacing:"0.3em", fontWeight:700, color:accent }}>{label}</span>
      </div>
      {children}
    </div>
  );
}