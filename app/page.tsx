"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Mode = "obsidian" | "aether";

const themes = {
  obsidian: {
    appName: "OBSIDIAN",
    tagline: "dark archive",
    bg: "#060009",
    accent: "#ff3d8b",
    secondary: "#bf5af2",
    tertiary: "#7b61ff",
    gradient: "linear-gradient(135deg,#ff3d8b,#bf5af2,#7b61ff)",
    textPrimary: "#ffffff",
    textMuted: "rgba(255,255,255,0.55)",
    textFaint: "rgba(255,255,255,0.25)",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,61,139,0.18)",
    cardGlow: "rgba(255,61,139,0.12)",
    heroLine2Accent: "Ruin",
    heroSub: "A shadowed archive for every dark obsession, every morally grey chapter that rewired your soul and left you wanting more.",
    ctaText: "Enter the Dark",
    ctaSecondary: "Browse Books",
    archetype: "Villain",
    vibeVal: "Obsessed",
    charVal: "The Hunter",
    vibeLabel: "Dominant Vibe",
    charLabel: "Character Addiction",
    profileBadge: "Dark Archive v1.0",
    books: [
      { title: "Haunting Adeline", author: "H.D. Carlton", quote: "He hunts. I run. But some part of me wants to be caught.", tag: "Dark Romance", tagColor: "#ff3d8b", side: "left" },
      { title: "God of Malice", author: "Rina Kent", quote: "He's chaos in human form. I'm completely addicted to the wreckage.", tag: "Dark Academia", tagColor: "#bf5af2", side: "right" },
      { title: "Brutal Prince", author: "Sophie Lark", quote: "I hate him. I hate how he makes me feel. I hate that I can't stop.", tag: "Enemies to Lovers", tagColor: "#7b61ff", side: "left" },
    ],
    switchLabel: "✦ Light Mode",
    footerQuote: "Some stories aren't meant to be healthy. They're meant to be unforgettable.",
    navItems: [
      { label: "My Obsessions", href: "/my-books" },
      { label: "Search", href: "/search" },
    ],
    threadTitle: "Books That Broke You",
    statsLabel: ["Books Tracked", "Readers", "Pages Logged"],
  },
  aether: {
    appName: "AETHER",
    tagline: "reading legacy",
    bg: "#f0ede8",
    accent: "#2563eb",
    secondary: "#7c3aed",
    tertiary: "#0891b2",
    gradient: "linear-gradient(135deg,#2563eb,#7c3aed,#0891b2)",
    textPrimary: "#0f0a1a",
    textMuted: "rgba(15,10,26,0.55)",
    textFaint: "rgba(15,10,26,0.25)",
    cardBg: "rgba(255,255,255,0.75)",
    cardBorder: "rgba(37,99,235,0.15)",
    cardGlow: "rgba(37,99,235,0.08)",
    heroLine2Accent: "Shape",
    heroSub: "A luminous sanctuary for your intellectual legacy. Trace the books that built you, chapter by chapter, into who you are.",
    ctaText: "Start Your Thread",
    ctaSecondary: "Explore Books",
    archetype: "Stoic",
    vibeVal: "Melancholy",
    charVal: "Amir",
    vibeLabel: "Dominant Emotion",
    charLabel: "Character Connection",
    profileBadge: "Neural Profile v1.0",
    books: [
      { title: "Atomic Habits", author: "James Clear", quote: "Small habits compound into an entirely different identity. It starts here.", tag: "Self-Growth", tagColor: "#2563eb", side: "left" },
      { title: "The Kite Runner", author: "Khaled Hosseini", quote: "There is a way to be good again. Amir taught me that redemption is always possible.", tag: "Literary Fiction", tagColor: "#7c3aed", side: "right" },
      { title: "The Alchemist", author: "Paulo Coelho", quote: "When you want something, all the universe conspires to help you achieve it.", tag: "Philosophy", tagColor: "#0891b2", side: "left" },
    ],
    switchLabel: "✦ Dark Mode",
    footerQuote: "Every book you've read is a piece of who you are becoming.",
    navItems: [
      { label: "My Library", href: "/my-books" },
      { label: "Search", href: "/search" },
    ],
    threadTitle: "Books That Built You",
    statsLabel: ["Books Tracked", "Readers", "Pages Logged"],
  },
};

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let n = 0;
    const step = Math.ceil(to / 60);
    const t = setInterval(() => {
      n += step;
      if (n >= to) { setVal(to); clearInterval(t); } else setVal(n);
    }, 20);
    return () => clearInterval(t);
  }, [to]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("obsidian");
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -50]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vibeMode") as Mode | null;
    if (saved) setMode(saved);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const toggleMode = () => {
    setMode(prev => {
      const next = prev === "obsidian" ? "aether" : "obsidian";
      localStorage.setItem("vibeMode", next);
      return next;
    });
  };

  const cfg = themes[mode];
  const isDark = mode === "obsidian";
  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen relative overflow-hidden"
        style={{ background: cfg.bg, fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Syne:wght@400;600;700;800&display=swap');
          @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
          @keyframes breathe { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
          @keyframes float-slow { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-12px) rotate(1deg)} 66%{transform:translateY(-6px) rotate(-1deg)} }
          .syne{font-family:'Syne',sans-serif}
          .shimmer-text{background-size:200% auto;animation:shimmer 4s linear infinite}
          .breathe{animation:breathe 5s ease-in-out infinite}
          .float-slow{animation:float-slow 9s ease-in-out infinite}
          ${isDark ? "::selection{background:rgba(255,61,139,.3)}" : "::selection{background:rgba(37,99,235,.2)}"}
        `}</style>

        {/* Ambient bg */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {isDark ? (
            <>
              <div style={{ position:'absolute', width:'70vw', height:'70vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,61,139,.14) 0%,transparent 70%)', top:'-20vw', left:'-15vw', filter:'blur(50px)' }} />
              <div style={{ position:'absolute', width:'55vw', height:'55vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(191,90,242,.10) 0%,transparent 70%)', bottom:'5vw', right:'-10vw', filter:'blur(50px)' }} />
            </>
          ) : (
            <>
              <div style={{ position:'absolute', width:'70vw', height:'70vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,.06) 0%,transparent 70%)', top:'-25vw', right:'-15vw', filter:'blur(60px)' }} />
              <div style={{ position:'absolute', width:'45vw', height:'45vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,.05) 0%,transparent 70%)', bottom:'0', left:'0', filter:'blur(50px)' }} />
            </>
          )}
        </div>

        {/* ── NAVBAR ── */}
        <nav
          className="sticky top-0 z-50"
          style={{
            background: isDark ? "rgba(6,0,9,0.85)" : "rgba(240,237,232,0.85)",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
            <div className="flex flex-col leading-none">
              <span className="syne text-xl font-black tracking-[0.15em] shimmer-text"
                style={{ background: cfg.gradient, backgroundClip:'text', WebkitBackgroundClip:'text', color:'transparent', backgroundSize:'200% auto' }}>
                {cfg.appName}
              </span>
              <span className="syne text-[9px] uppercase tracking-[0.4em]" style={{ color: cfg.textFaint }}>{cfg.tagline}</span>
            </div>

            <div className="flex items-center gap-6">
              {cfg.navItems.map(link => (
                <Link key={link.href} href={link.href}
                  className="syne text-[11px] uppercase tracking-[0.25em] font-semibold transition-colors"
                  style={{ color: cfg.textFaint }}>
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Link href="/my-books"
                  className="syne text-[11px] uppercase tracking-[0.25em] font-semibold transition-colors"
                  style={{ color: cfg.accent }}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/login"
                  className="syne text-[11px] uppercase tracking-[0.25em] font-semibold px-4 py-2 rounded-full"
                  style={{ background: `${cfg.accent}18`, color: cfg.accent }}>
                  Login
                </Link>
              )}
              <button onClick={toggleMode}
                className="syne text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border transition-all"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", color: cfg.textFaint, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                {cfg.switchLabel}
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-20 md:pt-28">
          <div className="grid md:grid-cols-[1fr_400px] gap-16 items-start">
            <motion.div style={{ y: heroY }}>
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
                className="flex items-center gap-3 mb-8">
                <div className="w-8 h-px" style={{ background: cfg.accent }} />
                <span className="syne text-[11px] uppercase tracking-[0.4em] font-semibold" style={{ color: cfg.accent }}>
                  {isDark ? "Your Dark Library" : "Your Reading Life"}
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.9, delay:0.1 }}
                className="font-black leading-[0.95] mb-8 tracking-tight"
                style={{ fontSize:"clamp(3rem,8vw,7rem)", color: cfg.textPrimary }}>
                The Books That
                <br />
                <span className="italic" style={{ color: cfg.accent }}>{cfg.heroLine2Accent}</span> You.
              </motion.h1>

              <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.25 }}
                className="text-xl leading-relaxed max-w-lg mb-12 italic"
                style={{ color: cfg.textMuted }}>
                {cfg.heroSub}
              </motion.p>

              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.4 }}
                className="flex flex-wrap gap-4 items-center">
                <Link href={user ? "/my-books" : "/login"}>
                  <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
                    className="syne inline-flex items-center gap-3 px-9 py-4 rounded-full font-bold text-sm uppercase tracking-widest text-white cursor-pointer"
                    style={{ background: cfg.gradient, boxShadow:`0 8px 40px ${cfg.accent}55` }}>
                    {cfg.ctaText}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </Link>
                <Link href="/search">
                  <span className="syne inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-widest border transition-all cursor-pointer"
                    style={{ borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", color: cfg.textMuted }}>
                    {cfg.ctaSecondary}
                  </span>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
                className="flex gap-10 mt-16 pt-8"
                style={{ borderTop:`1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {[
                  { n:48200, s:"+", i:0 }, { n:12400, s:"+", i:1 }, { n:3, s:"M+", i:2 }
                ].map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-3xl font-black tracking-tight"
                      style={{ color: idx===0 ? cfg.accent : idx===1 ? cfg.secondary : cfg.tertiary }}>
                      <Counter to={stat.n} suffix={stat.s} />
                    </div>
                    <div className="syne text-[11px] uppercase tracking-widest mt-1" style={{ color: cfg.textFaint }}>
                      {cfg.statsLabel[idx]}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Profile card */}
            <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:1.2, delay:0.3, ease:[0.22,1,0.36,1] }}
              className="float-slow">
              <div className="rounded-[2.5rem] p-8 border"
                style={{ background: cfg.cardBg, borderColor: cfg.cardBorder, boxShadow:`0 30px 80px ${cfg.cardGlow}`, backdropFilter:"blur(24px)" }}>
                <div className="flex items-center justify-between mb-8">
                  <span className="syne text-[10px] uppercase tracking-[0.35em] font-medium" style={{ color: cfg.textFaint }}>{cfg.profileBadge}</span>
                  <div className="flex gap-1.5">
                    {[cfg.accent, cfg.secondary, cfg.tertiary].map((c,i) => (
                      <div key={i} className="w-2 h-2 rounded-full breathe" style={{ background:c, animationDelay:`${i*0.5}s` }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-8 mb-8">
                  {[
                    { label:"Archetype", val:cfg.archetype, color:cfg.accent, bar:0.9 },
                    { label:cfg.vibeLabel, val:cfg.vibeVal, color:cfg.secondary, bar:0.75 },
                    { label:cfg.charLabel, val:cfg.charVal, color:cfg.tertiary, bar:0.85 },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5+i*0.15 }}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="syne text-[10px] uppercase tracking-[0.3em]" style={{ color: cfg.textFaint }}>{item.label}</span>
                        <span className="text-xl font-black italic" style={{ color: item.color }}>{item.val}</span>
                      </div>
                      <div className="h-[2px] w-full rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${item.bar*100}%` }}
                          transition={{ delay:0.8+i*0.15, duration:1.2, ease:"easeOut" }}
                          className="h-full rounded-full"
                          style={{ background:`linear-gradient(90deg,${item.color},${item.color}88)` }} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="h-px mb-6" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />

                <div>
                  <span className="syne text-[10px] uppercase tracking-[0.3em]" style={{ color: cfg.textFaint }}>Currently Reading</span>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="w-10 h-14 rounded-lg flex-shrink-0" style={{ background:`linear-gradient(135deg,${cfg.accent},${cfg.secondary})`, opacity:0.85 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-base leading-tight truncate" style={{ color: cfg.textPrimary }}>
                        {isDark ? "Haunting Adeline" : "Atomic Habits"}
                      </div>
                      <div className="text-xs mt-1 truncate" style={{ color: cfg.textMuted }}>
                        {isDark ? "H.D. Carlton • Ch. 14" : "James Clear • Ch. 6"}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width:"38%", background:cfg.accent }} />
                        </div>
                        <span className="syne text-[10px]" style={{ color: cfg.textFaint }}>38%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── THREAD ── */}
        <section className="relative z-10 mt-40 pb-24 max-w-4xl mx-auto px-6 md:px-10">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.8 }}
            className="text-center mb-20">
            <span className="syne text-[11px] uppercase tracking-[0.4em] font-semibold block mb-4" style={{ color: cfg.accent }}>
              {isDark ? "Your Spiral" : "Your Thread"}
            </span>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight" style={{ color: cfg.textPrimary }}>
              {cfg.threadTitle}
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
            <motion.div className="absolute left-1/2 top-0 w-[2px] -translate-x-1/2 origin-top"
              initial={{ scaleY:0 }} whileInView={{ scaleY:1 }} viewport={{ once:true }} transition={{ duration:2 }}
              style={{ background:`linear-gradient(to bottom, ${cfg.accent}, ${cfg.secondary}, transparent)`, height:'100%' }} />

            <div className="space-y-24">
              {cfg.books.map((book, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, x: book.side==="left" ? -50 : 50 }}
                  whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true, margin:"-80px" }}
                  transition={{ duration:0.8 }}
                  className={`relative flex items-center ${book.side==="left" ? "justify-start pr-[52%]" : "justify-end pl-[52%]"}`}>
                  <motion.div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 border-2"
                    style={{ background:book.tagColor, borderColor:isDark?"#060009":"#f0ede8", boxShadow:`0 0 20px ${book.tagColor}88` }}
                    whileInView={{ scale:[0,1.3,1] }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.3 }} />
                  <motion.div whileHover={{ y:-4, scale:1.02 }} transition={{ type:"spring", stiffness:300 }}
                    className="rounded-[1.75rem] p-7 border cursor-pointer"
                    style={{ background:cfg.cardBg, borderColor:cfg.cardBorder, boxShadow:`0 20px 60px ${cfg.cardGlow}`, backdropFilter:"blur(20px)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <span className="syne text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full"
                        style={{ background:`${book.tagColor}18`, color:book.tagColor }}>{book.tag}</span>
                      <div className="flex">
                        {[...Array(5)].map((_,si) => (
                          <svg key={si} width="12" height="12" viewBox="0 0 12 12" fill={si<4?book.tagColor:"none"} stroke={book.tagColor} strokeWidth="1">
                            <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.3 2.8,11 3.5,7.5 1,5 4.5,4.5" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-1" style={{ color: cfg.textPrimary }}>{book.title}</h3>
                    <p className="syne text-[11px] uppercase tracking-widest mb-4" style={{ color: cfg.textFaint }}>{book.author}</p>
                    <p className="text-base leading-relaxed italic" style={{ color: cfg.textMuted }}>"{book.quote}"</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="relative z-10 py-20 border-y" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
          <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-3 gap-6">
            {[
              { icon:"✦", title: isDark?"Dark Archive":"Reading Journal", desc: isDark?"Track every obsession, every forbidden read, every character that haunted you.":"Document your reading journey. Every book becomes part of your identity." },
              { icon:"◈", title: isDark?"Vibe Taxonomy":"Mood Analysis", desc: isDark?"Tag books by trope — dark romance, morally grey, antihero, forbidden love.":"See what emotions define your reading life. Discover patterns in your taste." },
              { icon:"⟡", title: isDark?"Obsession Thread":"Life Timeline", desc: isDark?"Watch your reading spiral unfold — every dark chapter stitched together.":"Build a beautiful timeline of the books that built you, chapter by chapter." },
            ].map((feat, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ duration:0.7, delay:i*0.15 }}
                whileHover={{ y:-6 }}
                className="rounded-[2rem] p-8 border cursor-pointer"
                style={{ background:cfg.cardBg, borderColor:cfg.cardBorder, backdropFilter:"blur(20px)", boxShadow:`0 10px 40px ${cfg.cardGlow}` }}>
                <div className="text-3xl mb-6 w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background:`${cfg.accent}18`, color:cfg.accent }}>{feat.icon}</div>
                <h3 className="text-xl font-black mb-3" style={{ color: cfg.textPrimary }}>{feat.title}</h3>
                <p className="leading-relaxed italic" style={{ color: cfg.textMuted }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="relative z-10 max-w-3xl mx-auto px-6 py-36 text-center">
          <motion.div initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:1 }}>
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="h-px w-16" style={{ background:`linear-gradient(to right,transparent,${cfg.accent})` }} />
              <div className="w-2 h-2 rounded-full breathe" style={{ background: cfg.accent }} />
              <div className="h-px w-16" style={{ background:`linear-gradient(to left,transparent,${cfg.accent})` }} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] mb-6" style={{ color: cfg.textPrimary }}>
              {isDark ? "Ready to fall\ninto the dark?" : "Ready to build\nyour legacy?"}
            </h2>
            <p className="text-lg italic mb-14 max-w-md mx-auto" style={{ color: cfg.textMuted }}>{cfg.footerQuote}</p>
            <Link href={user ? "/my-books" : "/login"}>
              <motion.div whileHover={{ scale:1.06 }} whileTap={{ scale:0.97 }}
                className="syne inline-flex items-center gap-4 px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest text-white cursor-pointer"
                style={{ background:cfg.gradient, boxShadow:`0 16px 64px ${cfg.accent}55` }}>
                {user ? (isDark ? "Enter Archive ✦" : "Open Library ✦") : cfg.ctaText}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8h14M8 1l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </Link>
            <p className="syne text-[10px] uppercase tracking-[0.4em] mt-12" style={{ color: cfg.textFaint }}>
              No spoilers. Just vibes. ✦ Free forever.
            </p>
          </motion.div>
        </section>
      </motion.main>
    </AnimatePresence>
  );
}