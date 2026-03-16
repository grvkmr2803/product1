"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

type Reader = {
  id: string;
  username: string;
  avatar_url: string | null;
  archetype: string | null;
  bio: string | null;
  followers_count: number;
  total_books: number;
  is_public: boolean;
};

type FeedItem = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
  status: string;
  trope_tags: string[];
  vibe_tag: string | null;
  added_at: string;
};

const ARCHETYPE_EMOJI: Record<string, string> = {
  villain: "🖤", romantic: "🌹", philosopher: "🌀", adventurer: "⚔️",
  empath: "🌸", stoic: "🪨", rebel: "⚡", dreamer: "✨",
};

type Tab = "discover" | "feed" | "following";

export default function CommunityPage() {
  const { mode, mounted } = useTheme();
  const t = themeTokens[mode];
  const isDark = mode === "obsidian";

  const [tab, setTab]               = useState<Tab>("discover");
  const [readers, setReaders]       = useState<Reader[]>([]);
  const [feed, setFeed]             = useState<FeedItem[]>([]);
  const [following, setFollowing]   = useState<Reader[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  // Load discover readers
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id,username,avatar_url,archetype,bio,followers_count,total_books,is_public")
      .eq("is_public", true)
      .order("followers_count", { ascending: false })
      .limit(40)
      .then(({ data }) => { setReaders(data ?? []); setLoading(false); });
  }, []);

  // Load following IDs
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("follows").select("following_id").eq("follower_id", currentUserId)
      .then(({ data }) => {
        setFollowingIds(new Set(data?.map(f => f.following_id) ?? []));
      });
  }, [currentUserId]);

  // Load feed
  const loadFeed = useCallback(async () => {
    if (!currentUserId) return;
    const { data: followData } = await supabase
      .from("follows").select("following_id").eq("follower_id", currentUserId);
    const ids = followData?.map(f => f.following_id) ?? [];
    if (ids.length === 0) { setFeed([]); return; }

    const { data } = await supabase
      .from("user_books")
      .select("id,user_id,title,author,cover_url,rating,status,trope_tags,vibe_tag,added_at")
      .in("user_id", ids)
      .order("added_at", { ascending: false })
      .limit(30);

    // Enrich with profile info
    const { data: profiles } = await supabase
      .from("profiles").select("id,username,avatar_url").in("id", ids);
    const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p]) ?? []);

    setFeed((data ?? []).map(b => ({
      ...b,
      username: profileMap[b.user_id]?.username ?? "unknown",
      avatar_url: profileMap[b.user_id]?.avatar_url ?? null,
    })));
  }, [currentUserId]);

  // Load following list
  const loadFollowing = useCallback(async () => {
    if (!currentUserId) return;
    const { data: followData } = await supabase
      .from("follows").select("following_id").eq("follower_id", currentUserId);
    const ids = followData?.map(f => f.following_id) ?? [];
    if (ids.length === 0) { setFollowing([]); return; }
    const { data } = await supabase
      .from("profiles").select("id,username,avatar_url,archetype,bio,followers_count,total_books,is_public")
      .in("id", ids);
    setFollowing(data ?? []);
  }, [currentUserId]);

  useEffect(() => {
    if (tab === "feed")      loadFeed();
    if (tab === "following") loadFollowing();
  }, [tab, loadFeed, loadFollowing]);

  const handleFollow = async (targetId: string) => {
    if (!currentUserId) return;
    setFollowLoading(targetId);
    if (followingIds.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", targetId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
      setReaders(prev => prev.map(r => r.id === targetId ? { ...r, followers_count: r.followers_count - 1 } : r));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetId });
      setFollowingIds(prev => new Set([...prev, targetId]));
      setReaders(prev => prev.map(r => r.id === targetId ? { ...r, followers_count: r.followers_count + 1 } : r));
    }
    setFollowLoading(null);
  };

  const filteredReaders = readers.filter(r =>
    r.id !== currentUserId &&
    (!search || r.username.toLowerCase().includes(search.toLowerCase()) ||
     r.archetype?.toLowerCase().includes(search.toLowerCase()))
  );

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0)  return `${days}d ago`;
    if (hrs > 0)   return `${hrs}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return "just now";
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: t.bg, fontFamily: "'Playfair Display', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap');`}</style>
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position:"absolute", width:"55vw", height:"55vw", borderRadius:"50%", background:`radial-gradient(circle,${t.accent}10 0%,transparent 70%)`, top:"-15vw", right:"-10vw", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", width:"40vw", height:"40vw", borderRadius:"50%", background:`radial-gradient(circle,${t.secondary}08 0%,transparent 70%)`, bottom:"5vw", left:"-5vw", filter:"blur(50px)" }} />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-24">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }} className="mb-10">
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, textTransform:"uppercase", letterSpacing:"0.4em", color:t.accent }}>
            {isDark ? "Find Your People" : "Reader Community"}
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mt-2" style={{ color:t.textPrimary }}>
            {isDark ? "The Archive\nNetwork" : "Community"}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-8 w-fit border"
          style={{ background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", borderColor:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)" }}>
          {([
            { key:"discover", label:"Discover" },
            { key:"feed",     label:isDark?"Activity Feed":"Feed" },
            { key:"following",label:"Following" },
          ] as { key:Tab; label:string }[]).map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                fontFamily:"'Syne',sans-serif",
                background: tab===tb.key ? (isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.9)") : "transparent",
                color: tab===tb.key ? t.accent : t.textFaint,
                boxShadow: tab===tb.key ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
              }}>
              {tb.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── DISCOVER TAB ── */}
          {tab === "discover" && (
            <motion.div key="discover" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}>
              {/* Search */}
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border mb-8 max-w-md"
                style={{ background:t.cardBg, borderColor:t.inputBorder, backdropFilter:"blur(12px)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color:t.textFaint, flexShrink:0 }}>
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="m12 12 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search readers or archetypes..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ fontFamily:"'Playfair Display',serif", color:t.textPrimary }} />
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:"linear" }}
                    className="w-8 h-8 rounded-full border-2 border-t-transparent"
                    style={{ borderColor:`${t.accent}44`, borderTopColor:t.accent }} />
                </div>
              ) : filteredReaders.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl italic" style={{ color:t.textMuted }}>No readers found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReaders.map((reader, i) => (
                    <motion.div key={reader.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:i*0.04 }} whileHover={{ y:-4 }}
                      className="rounded-2xl border p-5 transition-all"
                      style={{ background:t.cardBg, borderColor:t.cardBorder, backdropFilter:"blur(16px)", boxShadow:`0 8px 32px ${t.cardGlow}` }}>

                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar */}
                        <Link href={`/u/${reader.username}`} className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2"
                            style={{ borderColor:`${t.accent}44` }}>
                            {reader.avatar_url ? (
                              <img src={reader.avatar_url} alt={reader.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-black text-xl"
                                style={{ backgroundImage:`linear-gradient(135deg,${t.accent}22,${t.secondary}22)`, color:t.accent }}>
                                {reader.username[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`/u/${reader.username}`}>
                            <h3 className="font-black text-base leading-tight hover:opacity-70 transition-opacity"
                              style={{ color:t.textPrimary }}>@{reader.username}</h3>
                          </Link>
                          {reader.archetype && (
                            <span className="text-xs" style={{ color:t.accent }}>
                              {ARCHETYPE_EMOJI[reader.archetype]} {reader.archetype}
                            </span>
                          )}
                          {reader.bio && (
                            <p className="text-xs italic mt-1 line-clamp-2" style={{ color:t.textMuted }}>{reader.bio}</p>
                          )}
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex gap-4 mb-4">
                        {[
                          { label:"Books",     val:reader.total_books     },
                          { label:"Followers", val:reader.followers_count },
                        ].map(s => (
                          <div key={s.label}>
                            <div className="font-black text-lg" style={{ color:t.accent }}>{s.val}</div>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, textTransform:"uppercase", letterSpacing:"0.3em", color:t.textFaint }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/u/${reader.username}`} className="flex-1">
                          <div className="py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center border transition-all"
                            style={{ fontFamily:"'Syne',sans-serif", borderColor:t.cardBorder, color:t.textMuted }}>
                            View
                          </div>
                        </Link>
                        {currentUserId && currentUserId !== reader.id && (
                          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                            onClick={() => handleFollow(reader.id)}
                            disabled={followLoading === reader.id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            style={{
                              fontFamily:"'Syne',sans-serif",
                              backgroundImage: followingIds.has(reader.id) ? "none" : t.gradient,
                              background: followingIds.has(reader.id) ? (isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)") : undefined,
                              color: followingIds.has(reader.id) ? t.textMuted : "#fff",
                              border: followingIds.has(reader.id) ? `1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}` : "none",
                              boxShadow: followingIds.has(reader.id) ? "none" : `0 4px 16px ${t.accent}44`,
                              cursor: followLoading===reader.id ? "wait" : "pointer",
                            }}>
                            {followLoading===reader.id ? "..." : followingIds.has(reader.id) ? "✓ Following" : "Follow"}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FEED TAB ── */}
          {tab === "feed" && (
            <motion.div key="feed" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}>
              {!currentUserId ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔒</div>
                  <p className="text-xl font-black italic mb-3" style={{ color:t.textPrimary }}>Login to see your feed.</p>
                  <Link href="/login">
                    <motion.div whileHover={{ scale:1.04 }} className="inline-block px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm"
                      style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient, boxShadow:`0 8px 32px ${t.accent}44` }}>Login</motion.div>
                  </Link>
                </div>
              ) : feed.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">{isDark ? "🌙" : "📚"}</div>
                  <p className="text-xl font-black italic mb-3" style={{ color:t.textPrimary }}>
                    {isDark ? "Your feed is empty." : "Nothing here yet."}
                  </p>
                  <p className="italic mb-6" style={{ color:t.textMuted }}>Follow some readers to see their activity.</p>
                  <button onClick={() => setTab("discover")}
                    className="px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm"
                    style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient, boxShadow:`0 8px 32px ${t.accent}44` }}>
                    Discover Readers
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  {feed.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:i*0.04 }}
                      className="flex gap-4 p-5 rounded-2xl border"
                      style={{ background:t.cardBg, borderColor:t.cardBorder, backdropFilter:"blur(16px)" }}>

                      {/* User avatar */}
                      <Link href={`/u/${item.username}`} className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border" style={{ borderColor:`${t.accent}33` }}>
                          {item.avatar_url
                            ? <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center font-black text-sm"
                                style={{ backgroundImage:`linear-gradient(135deg,${t.accent}22,${t.secondary}22)`, color:t.accent }}>
                                {item.username[0].toUpperCase()}
                              </div>}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Link href={`/u/${item.username}`}>
                            <span className="font-black text-sm hover:opacity-70" style={{ color:t.accent, fontFamily:"'Syne',sans-serif" }}>
                              @{item.username}
                            </span>
                          </Link>
                          <span className="text-xs italic" style={{ color:t.textMuted }}>
                            {item.status === "finished" ? "finished" : item.status === "reading" ? "is reading" : "added"}
                          </span>
                          <span className="text-xs" style={{ color:t.textFaint, fontFamily:"'Syne',sans-serif" }}>{timeAgo(item.added_at)}</span>
                        </div>

                        <div className="flex gap-3 items-start">
                          {item.cover_url && (
                            <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background:`linear-gradient(135deg,${t.accent}22,${t.secondary}22)` }}>
                              <img src={item.cover_url.replace("http://","https://")} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-sm" style={{ color:t.textPrimary }}>{item.title}</p>
                            <p className="text-xs italic" style={{ color:t.textMuted }}>{item.author}</p>
                            {item.rating && (
                              <p className="text-xs mt-1" style={{ color:t.accent }}>{"★".repeat(item.rating)}</p>
                            )}
                            {item.vibe_tag && (
                              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full"
                                style={{ fontFamily:"'Syne',sans-serif", background:`${t.secondary}18`, color:t.secondary }}>
                                {item.vibe_tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FOLLOWING TAB ── */}
          {tab === "following" && (
            <motion.div key="following" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.35 }}>
              {!currentUserId ? (
                <div className="text-center py-20">
                  <p className="text-xl font-black italic mb-3" style={{ color:t.textPrimary }}>Login to see who you follow.</p>
                  <Link href="/login">
                    <motion.div whileHover={{ scale:1.04 }} className="inline-block px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm"
                      style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient }}>Login</motion.div>
                  </Link>
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">👥</div>
                  <p className="text-xl font-black italic mb-3" style={{ color:t.textPrimary }}>Not following anyone yet.</p>
                  <button onClick={() => setTab("discover")}
                    className="px-8 py-4 rounded-full text-white font-black uppercase tracking-widest text-sm"
                    style={{ fontFamily:"'Syne',sans-serif", backgroundImage:t.gradient, boxShadow:`0 8px 32px ${t.accent}44` }}>
                    Discover Readers
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {following.map((reader, i) => (
                    <motion.div key={reader.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:i*0.04 }} whileHover={{ y:-4 }}
                      className="rounded-2xl border p-5"
                      style={{ background:t.cardBg, borderColor:t.cardBorder, backdropFilter:"blur(16px)" }}>
                      <div className="flex items-center gap-3 mb-4">
                        <Link href={`/u/${reader.username}`} className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2" style={{ borderColor:`${t.accent}44` }}>
                            {reader.avatar_url
                              ? <img src={reader.avatar_url} alt={reader.username} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-black"
                                  style={{ backgroundImage:`linear-gradient(135deg,${t.accent}22,${t.secondary}22)`, color:t.accent }}>
                                  {reader.username[0].toUpperCase()}
                                </div>}
                          </div>
                        </Link>
                        <div>
                          <Link href={`/u/${reader.username}`}>
                            <h3 className="font-black text-base hover:opacity-70" style={{ color:t.textPrimary }}>@{reader.username}</h3>
                          </Link>
                          {reader.archetype && (
                            <span className="text-xs" style={{ color:t.accent }}>{ARCHETYPE_EMOJI[reader.archetype]} {reader.archetype}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 mb-3">
                        {[{ label:"Books", val:reader.total_books },{ label:"Followers", val:reader.followers_count }].map(s => (
                          <div key={s.label}>
                            <div className="font-black text-lg" style={{ color:t.accent }}>{s.val}</div>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, textTransform:"uppercase", letterSpacing:"0.3em", color:t.textFaint }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/u/${reader.username}`} className="flex-1">
                          <div className="py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center border"
                            style={{ fontFamily:"'Syne',sans-serif", borderColor:t.cardBorder, color:t.textMuted }}>View</div>
                        </Link>
                        <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                          onClick={() => handleFollow(reader.id)} disabled={followLoading===reader.id}
                          className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                          style={{
                            fontFamily:"'Syne',sans-serif",
                            background: isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",
                            color:t.textMuted,
                            border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`,
                          }}>
                          {followLoading===reader.id ? "..." : "Unfollow"}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}