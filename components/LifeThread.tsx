"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useRef, useMemo } from "react";
import Link from "next/link";
import type { UserBook } from "@/lib/supabase";

type LifeThreadProps = {
  books: UserBook[];
  mode?: "aether" | "obsidian";
};

export default function LifeThread({ books, mode = "aether" }: LifeThreadProps) {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  const isObsidian = mode === "obsidian";

  const accent      = isObsidian ? "#ff3d8b" : "#2563eb";
  const secondary   = isObsidian ? "#bf5af2" : "#7c3aed";
  const nodeShadow  = isObsidian ? "rgba(255,61,139,0.9)" : "rgba(37,99,235,0.9)";
  const glowSoft    = isObsidian ? "rgba(255,61,139,0.35)" : "rgba(37,99,235,0.25)";
  const textPrimary = isObsidian ? "#ffffff" : "#0f0a1a";
  const textMuted   = isObsidian ? "rgba(255,255,255,0.5)" : "rgba(15,10,26,0.5)";
  const textFaint   = isObsidian ? "rgba(255,255,255,0.25)" : "rgba(15,10,26,0.25)";
  const cardBg      = isObsidian ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.75)";
  const cardBorder  = isObsidian ? "rgba(255,61,139,0.18)" : "rgba(37,99,235,0.15)";
  const yearBg      = isObsidian ? "#060009" : "#f0ede8";

  // Sort chronologically
  const sortedBooks = useMemo(() =>
    [...books].sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime()),
    [books]
  );

  // Group by year
  const grouped = useMemo(() => {
    return sortedBooks.reduce((acc: Record<string, UserBook[]>, book) => {
      const year = new Date(book.added_at).getFullYear().toString();
      if (!acc[year]) acc[year] = [];
      acc[year].push(book);
      return acc;
    }, {});
  }, [sortedBooks]);

  if (books.length === 0) return null;

  return (
    <div ref={containerRef} className="relative mt-8 pb-20">

      {/* Particles */}
      {Array.from({ length: isObsidian ? 40 : 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: accent,
            opacity: 0.3,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 3 }}
        />
      ))}

      {/* Static beam track */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
        style={{ background: isObsidian ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />

      {/* Animated beam */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[3px] z-10 overflow-hidden">
        <motion.div
          style={{ scaleY, originY: 0, height: "100%" }}
          className="absolute inset-0"
          css-trick="gradient"
        >
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(to bottom, ${accent}, ${secondary}, transparent)`,
            boxShadow: `0 0 20px ${accent}`,
          }} />
        </motion.div>

        {/* Travelling pulse */}
        <motion.div
          animate={{ y: ["-10%", "110%"] }}
          transition={{ duration: isObsidian ? 2.5 : 3.5, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            width: 8, height: 64,
            background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
            filter: "blur(3px)", opacity: 0.8,
          }}
        />
      </div>

      {/* Content */}
      <div className="space-y-28 relative z-20">
        {Object.entries(grouped).map(([year, yearBooks]) => (
          <div key={year}>
            {/* Year pill */}
            <div className="flex justify-center mb-14">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="px-6 py-2 rounded-full border text-xs uppercase tracking-[0.4em] font-semibold"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  background: yearBg,
                  borderColor: `${accent}44`,
                  color: accent,
                  backdropFilter: "blur(12px)",
                  boxShadow: `0 0 20px ${accent}22`,
                }}
              >
                {year}
              </motion.div>
            </div>

            <div className="space-y-24">
              {yearBooks.map((book, index) => {
                const isLeft = index % 2 === 0;

                return (
                  <div
                    key={book.id}
                    className={`relative flex items-center ${isLeft ? "justify-start pr-[52%]" : "justify-end pl-[52%]"}`}
                  >
                    {/* Pulsing node */}
                    {/* Glow ring — tween only, no spring */}
                    <motion.div
                      animate={{
                        boxShadow: [
                          `0 0 6px ${nodeShadow}`,
                          `0 0 28px ${nodeShadow}`,
                          `0 0 6px ${nodeShadow}`,
                        ],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        position: "absolute", left: "50%", transform: "translateX(-50%)",
                        width: 16, height: 16, borderRadius: "50%",
                        zIndex: 30,
                      }}
                    />
                    {/* Node dot — spring entry, no keyframes */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      style={{
                        position: "absolute", left: "50%", transform: "translateX(-50%)",
                        width: 16, height: 16, borderRadius: "50%",
                        background: "#fff",
                        border: `2px solid ${accent}`,
                        zIndex: 31,
                      }}
                    />

                    {/* Energy burst on enter */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0.6 }}
                      whileInView={{ scale: 3, opacity: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      style={{
                        position: "absolute", left: "50%", transform: "translateX(-50%)",
                        width: 16, height: 16, borderRadius: "50%",
                        background: accent, filter: "blur(4px)",
                      }}
                    />

                    {/* Connector line */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        height: 1,
                        width: 32,
                        background: isLeft
                          ? `linear-gradient(to left, transparent, ${accent})`
                          : `linear-gradient(to right, transparent, ${accent})`,
                        ...(isLeft ? { right: "50%", marginRight: 8 } : { left: "50%", marginLeft: 8 }),
                      }}
                    />

                    {/* Book card */}
                    <Link href={`/book/${book.google_book_id}`} className="block w-full max-w-sm">
                      <motion.div
                        initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="group p-5 rounded-2xl border transition-all duration-400 cursor-pointer"
                        style={{
                          background: cardBg,
                          borderColor: cardBorder,
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          boxShadow: `0 8px 32px ${glowSoft}22`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}66`;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 60px ${glowSoft}`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${glowSoft}22`;
                        }}
                      >
                        <div className="flex gap-4">
                          {/* Cover */}
                          <div
                            className="flex-shrink-0 rounded-xl overflow-hidden"
                            style={{
                              width: 64, height: 90,
                              background: `linear-gradient(135deg, ${accent}44, ${secondary}44)`,
                              boxShadow: `0 8px 24px rgba(0,0,0,0.2)`,
                            }}
                          >
                            {book.cover_url ? (
                              <img
                                src={book.cover_url.replace("http://", "https://")}
                                alt={book.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📖</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-sm font-black leading-tight mb-1 truncate transition-colors duration-300"
                              style={{ fontFamily: "'Playfair Display', serif", color: textPrimary }}
                            >
                              {book.title}
                            </h3>
                            <p
                              className="text-[10px] uppercase tracking-widest mb-3"
                              style={{ fontFamily: "'Syne', sans-serif", color: textFaint, fontStyle: "italic" }}
                            >
                              {book.author}
                            </p>

                            {/* Status + rating row */}
                            <div className="flex items-center gap-2 mb-3">
                              <span
                                className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                  fontFamily: "'Syne', sans-serif",
                                  background: `${accent}18`,
                                  color: accent,
                                }}
                              >
                                {book.status === "want_to_read" ? "Want to Read"
                                  : book.status === "reading" ? "📖 Reading"
                                  : book.status === "finished" ? "✦ Finished"
                                  : "DNF"}
                              </span>
                              {book.rating && (
                                <span className="text-[10px]" style={{ color: accent }}>
                                  {"★".repeat(book.rating)}
                                </span>
                              )}
                            </div>

                            {/* Note / trope tags */}
                            {book.note && (
                              <p
                                className="text-[11px] leading-relaxed italic line-clamp-2"
                                style={{ color: textMuted }}
                              >
                                "{book.note}"
                              </p>
                            )}

                            {!book.note && book.trope_tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {book.trope_tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag}
                                    className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{
                                      fontFamily: "'Syne', sans-serif",
                                      background: `${secondary}18`,
                                      color: secondary,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Progress bar if reading */}
                            {book.status === "reading" && book.progress > 0 && (
                              <div className="mt-3">
                                <div className="h-1 rounded-full overflow-hidden"
                                  style={{ background: isObsidian ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${book.progress}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ background: accent }}
                                  />
                                </div>
                                <span className="text-[9px] mt-1 block" style={{ fontFamily: "'Syne', sans-serif", color: textFaint }}>
                                  {book.progress}% read
                                </span>
                              </div>
                            )}

                            {/* Hover CTA */}
                            <p
                              className="text-[9px] uppercase tracking-[0.2em] mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ fontFamily: "'Syne', sans-serif", color: accent }}
                            >
                              View & Edit →
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}