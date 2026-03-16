"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { UserBook } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

type PublicProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  archetype: string | null;
  bio: string | null;
  is_public: boolean;
  followers_count: number;
  following_count: number;
  total_books: number;
};

const ARCHETYPE_EMOJI: Record<string, string> = {
  villain: "🖤", romantic: "🌹", philosopher: "🌀", adventurer: "⚔️",
  empath: "🌸", stoic: "🪨", rebel: "⚡", dreamer: "✨",
};

const STATUS_EMOJI: Record<string, string> = {
  reading: "📖", want_to_read: "🔖", finished: "✦", dnf: "✕",
};

type FilterStatus = "all" | "reading" | "finished" | "want_to_read";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";
  const router = useRouter();

  const [profile, setProfile]       = useState<PublicProfile | null>(null);
  const [books, setBooks]           = useState<UserBook[]>([]);
  const [loading, setLoading]       = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing]     = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [filter, setFilter]         = useState<FilterStatus>("all");
  const [isOwnProfile, setIsOwnProfile]   = useState(false);
  const [notFound, setNotFound]     = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  // Load profile
  useEffect(() => {
    if (!username) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        setProfile(data);
      });
  }, [username]);

  // Load books + follow status
  useEffect(() => {
    if (!profile) return;
    setIsOwnProfile(currentUserId === profile.id);

    // Load public books
    supabase
      .from("user_books")
      .select("*")
      .eq("user_id", profile.id)
      .order("added_at", { ascending: false })
      .then(({ data }) => { setBooks(data ?? []); setLoading(false); });

    // Check if following
    if (currentUserId && currentUserId !== profile.id) {
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", profile.id)
        .single()
        .then(({ data }) => setIsFollowing(!!data));
    }
  }, [profile, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId) { router.push("/login"); return; }
    if (!profile) return;
    setFollowLoading(true);

    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profile.id);
      setIsFollowing(false);
      setProfile(p => p ? { ...p, followers_count: p.followers_count - 1 } : p);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: profile.id,
      });
      setIsFollowing(true);
      setProfile(p => p ? { ...p, followers_count: p.followers_count + 1 } : p);
    }
    setFollowLoading(false);
  };

  const filtered = books.filter(b => filter === "all" || b.status === filter);

  const stats = {
    finished:   books.filter(b => b.status === "finished").length,
    reading:    books.filter(b => b.status === "reading").length,
    avgRating: books.filter(b => b.rating).length
      ? (books.filter(b => b.rating).reduce((a, b) => a + (b.rating ?? 0), 0) /
         books.filter(b => b.rating).length).toFixed(1)
      : null,
    topTrope: (() => {
      const c: Record<string, number> = {};
      books.forEach(b => b.trope_tags?.forEach(t => { c[t] = (c[t] ?? 0) + 1; }));
      return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    })(),
  };

  if (!mounted) return null;

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: t.bg }}>
      <Navbar />
      <p className="text-2xl font-black italic" style={{ color: t.textPrimary }}>User not found.</p>
      <Link href="/community" style={{ color: t.accent, fontFamily: "'Syne',sans-serif", fontSize: 13 }}>
        ← Browse Readers
      </Link>
    </div>
  );

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 rounded-full border-2 border-t-transparent"
        style={{ borderColor: `${t.accent}44`, borderTopColor: t.accent }} />
    </div>
  );

  if (!profile.is_public && !isOwnProfile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: t.bg }}>
      <Navbar />
      <div className="text-5xl mb-2">🔒</div>
      <p className="text-2xl font-black italic" style={{ color: t.textPrimary }}>This archive is private.</p>
      <Link href="/community" style={{ color: t.accent, fontFamily: "'Syne',sans-serif", fontSize: 13 }}>← Browse Readers</Link>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily: "'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>
      <Navbar />

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:"absolute", width:"60vw", height:"60vw", borderRadius:"50%", background:`radial-gradient(circle,${t.accent}10 0%,transparent 70%)`, top:"-15vw", right:"-10vw", filter:"blur(60px)" }} />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 pt-12 pb-24">

        {/* Back */}
        <Link href="/community" className="inline-flex items-center gap-2 mb-10 transition-opacity hover:opacity-70"
          style={{ fontFamily:"'Syne',sans-serif", fontSize:11, textTransform:"uppercase", letterSpacing:"0.2em", color:t.textFaint }}>
          ← Community
        </Link>

        {/* ── PROFILE HEADER ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
          className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-2"
              style={{ borderColor:t.accent, boxShadow:`0 0 40px ${t.accent}44` }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black"
                  style={{ backgroundImage:`linear-gradient(135deg,${t.accent}33,${t.secondary}33)`, color:t.accent }}>
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>
            {profile.archetype && (
              <div className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
                style={{ background:t.bg, borderColor:t.accent }}>
                {ARCHETYPE_EMOJI[profile.archetype] ?? "✦"}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color:t.textPrimary }}>
              @{profile.username}
            </h1>
            {profile.bio && (
              <p className="italic text-base mb-3 max-w-md" style={{ color:t.textMuted }}>{profile.bio}</p>
            )}

            {/* Counts */}
            <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-4">
              {[
                { label:"Books",     val:books.length,            color:t.accent    },
                { label:"Finished",  val:stats.finished,          color:t.secondary },
                { label:"Followers", val:profile.followers_count, color:t.tertiary  },
                { label:"Following", val:profile.following_count, color:t.accent    },
                ...(stats.avgRating ? [{ label:"Avg ★", val:stats.avgRating, color:t.accent }] : []),
              ].map(s => (
                <div key={s.label} className="text-center md:text-left">
                  <div className="text-2xl font-black" style={{ color:s.color }}>{s.val}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, textTransform:"uppercase", letterSpacing:"0.3em", color:t.textFaint }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trope badge */}
            {stats.topTrope && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mr-2"
                style={{ fontFamily:"'Syne',sans-serif", background:`${t.accent}18`, color:t.accent }}>
                Top: {stats.topTrope}
              </span>
            )}
            {profile.archetype && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ fontFamily:"'Syne',sans-serif", background:`${t.secondary}18`, color:t.secondary }}>
                {ARCHETYPE_EMOJI[profile.archetype]} {profile.archetype}
              </span>
            )}
          </div>

          {/* Follow / Edit button */}
          <div className="flex-shrink-0">
            {isOwnProfile ? (
              <Link href="/profile">
                <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
                  className="px-8 py-3 rounded-full font-black text-sm uppercase tracking-wider border cursor-pointer transition-all"
                  style={{ fontFamily:"'Syne',sans-serif", borderColor:t.accent, color:t.accent, background:`${t.accent}12` }}>
                  Edit Profile
                </motion.div>
              </Link>
            ) : (
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
                onClick={handleFollow} disabled={followLoading}
                className="px-8 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-all"
                style={{
                  fontFamily:"'Syne',sans-serif",
                  backgroundImage: isFollowing ? "none" : t.gradient,
                  background: isFollowing ? (isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)") : undefined,
                  color: isFollowing ? t.textMuted : "#fff",
                  border: isFollowing ? `1px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}` : "none",
                  boxShadow: isFollowing ? "none" : `0 8px 32px ${t.accent}44`,
                  cursor: followLoading ? "wait" : "pointer",
                }}>
                {followLoading ? "..." : isFollowing ? "✓ Following" : isDark ? "Follow ✦" : "Follow"}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── FILTER TABS ── */}
        <div className="flex gap-2 flex-wrap mb-8">
          {(["all","reading","finished","want_to_read"] as FilterStatus[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                fontFamily:"'Syne',sans-serif",
                background: filter===f ? t.accent : (isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"),
                color: filter===f ? "#fff" : t.textMuted,
                boxShadow: filter===f ? `0 4px 16px ${t.accent}44` : "none",
              }}>
              {f==="all" ? `All (${books.length})`
                : f==="reading" ? `📖 Reading (${stats.reading})`
                : f==="finished" ? `✦ Finished (${stats.finished})`
                : `🔖 Want to Read (${books.filter(b=>b.status==="want_to_read").length})`}
            </button>
          ))}
        </div>

        {/* ── BOOK GRID ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl italic" style={{ color:t.textMuted }}>No books here yet.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((book, i) => (
              <motion.div key={book.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.03 }} className="group">
                <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[2/3]"
                  style={{ background:`linear-gradient(135deg,${t.accent}33,${t.secondary}33)`, boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
                  {book.cover_url
                    ? <img src={book.cover_url.replace("http://","https://")} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>}
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
                </div>
                <h3 className="font-black text-sm leading-tight mb-1 line-clamp-2" style={{ color:t.textPrimary }}>{book.title}</h3>
                <p className="text-xs italic line-clamp-1" style={{ color:t.textMuted }}>{book.author}</p>
                {book.trope_tags?.slice(0,1).map(tag => (
                  <span key={tag} className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                    style={{ fontFamily:"'Syne',sans-serif", background:`${t.accent}18`, color:t.accent }}>{tag}</span>
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}