"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme, themeTokens } from "@/hooks/useTheme";
import Navbar from "@/components/Navbar";

type GoogleBook = {
id: string;
volumeInfo: {
title: string;
authors?: string[];
description?: string;
imageLinks?: { thumbnail?: string; smallThumbnail?: string };
categories?: string[];
pageCount?: number;
averageRating?: number;
publishedDate?: string;
};
};

const TROPE_TAGS = [
"Dark Romance",
"Enemies to Lovers",
"Forbidden Love",
"Morally Grey",
"Found Family",
"Slow Burn",
"Second Chance",
"Age Gap",
"Fantasy",
"Thriller",
"Self-Growth",
"Literary Fiction",
];

export default function SearchPage() {
const { mode, mounted } = useTheme();
const t = themeTokens[mode];
const isDark = mode === "obsidian";
const router = useRouter();

const [query, setQuery] = useState("");
const [results, setResults] = useState<GoogleBook[]>([]);
const [loading, setLoading] = useState(false);
const [adding, setAdding] = useState<string | null>(null);
const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
const [userId, setUserId] = useState<string | null>(null);
const [toast, setToast] = useState<string | null>(null);
const [activeTag, setActiveTag] = useState<string | null>(null);
const [searchError, setSearchError] = useState<string | null>(null);

const debounceRef = useRef<NodeJS.Timeout | null>(null);
const abortRef = useRef<AbortController | null>(null);
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
const getUser = async () => {
const { data } = await supabase.auth.getUser();
setUserId(data.user?.id ?? null);
};
getUser();
}, []);

const showToast = (msg: string) => {
setToast(msg);
setTimeout(() => setToast(null), 3000);
};

const searchBooks = useCallback(async (q: string) => {


if (q.trim().length < 2) {
  setResults([]);
  setSearchError(null);
  return;
}

abortRef.current?.abort();
const controller = new AbortController();
abortRef.current = controller;

setLoading(true);
setSearchError(null);

try {

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q.trim())}&maxResults=18`;

  const res = await fetch(url, { signal: controller.signal });

  if (!res.ok) {
    console.error("Google Books API error:", res.status);
    setSearchError("API error. Try again later.");
    return;
  }

  const data = await res.json();

  setResults(data.items ?? []);

  if (!data.items || data.items.length === 0) {
    setSearchError("No books found.");
  }

} catch (err: any) {

  if (err.name !== "AbortError") {
    console.error(err);
    setSearchError("Search failed. Check connection.");
    setResults([]);
  }

} finally {
  setLoading(false);
}


}, []);

const handleInput = (val: string) => {
setQuery(val);
setActiveTag(null);


if (debounceRef.current) clearTimeout(debounceRef.current);

debounceRef.current = setTimeout(() => {
  searchBooks(val);
}, 800);


};

const handleTagSearch = (tag: string) => {
setActiveTag(tag);
setQuery(tag);
searchBooks(tag);
};

const addToLibrary = async (book: GoogleBook) => {

if (!userId) {
  router.push("/login");
  return;
}

setAdding(book.id);

const v = book.volumeInfo;

const rawCover =
  v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;

const cover = rawCover
  ? rawCover.replace("http://", "https://").replace("&edge=curl", "")
  : null;

const { error } = await supabase.from("user_books").upsert(
  {
    user_id: userId,
    google_book_id: book.id,
    title: v.title,
    author: v.authors?.[0] ?? "Unknown",
    cover_url: cover,
    status: "want_to_read",
  },
  { onConflict: "user_id,google_book_id" }
);

if (!error) {
  setAddedIds(prev => new Set([...prev, book.id]));
  router.refresh();

  showToast(
    isDark
      ? `"${v.title}" added to your archive ✦`
      : `"${v.title}" added to your library ✦`
  );

} else {
  showToast("Failed to add book.");
}

setAdding(null);


};

if (!mounted) return null;

return (
<div className="min-h-screen" style={{ background: t.bg }}> <Navbar />


  <main className="max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-24">

    <div className="mb-10">
      <span className="text-xs uppercase tracking-[0.4em] font-semibold block mb-4"
        style={{ color: t.accent }}>
        {isDark ? "Find Your Next Obsession" : "Discover Your Next Read"}
      </span>

      <h1 className="text-5xl md:text-6xl font-black tracking-tight"
        style={{ color: t.textPrimary }}>
        {isDark ? "Search the Archive" : "Search Books"}
      </h1>
    </div>

    <div className="relative mb-8">
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border"
        style={{ background: t.cardBg, borderColor: t.inputBorder }}>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search by title or author..."
          className="flex-1 bg-transparent outline-none text-lg"
          style={{ color: t.textPrimary }}
        />

        {loading && (
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${t.accent}44`, borderTopColor: t.accent }} />
        )}

      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-10">
      {TROPE_TAGS.map(tag => (
        <button
          key={tag}
          onClick={() => handleTagSearch(tag)}
          className="px-4 py-2 rounded-full text-xs font-semibold"
          style={{
            background: activeTag === tag ? t.accent : "rgba(0,0,0,0.05)",
            color: activeTag === tag ? "#fff" : t.textMuted
          }}>
          {tag}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">

      {results.map(book => (

        <div key={book.id}>

          <Link href={`/book/${book.id}`}>

            <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-gray-200">

              {book.volumeInfo.imageLinks?.thumbnail ? (

                <img
                  src={book.volumeInfo.imageLinks.thumbnail
                    .replace("http://", "https://")
                    .replace("&edge=curl", "")}
                  alt={book.volumeInfo.title}
                  className="w-full h-full object-cover"
                />

              ) : (

                <div className="flex items-center justify-center h-full">
                  📖
                </div>

              )}

            </div>

          </Link>

          <h3 className="font-bold text-sm line-clamp-2"
            style={{ color: t.textPrimary }}>
            {book.volumeInfo.title}
          </h3>

          <p className="text-xs italic mb-2"
            style={{ color: t.textMuted }}>
            {book.volumeInfo.authors?.[0] ?? "Unknown"}
          </p>

          <button
            onClick={() => addToLibrary(book)}
            disabled={adding === book.id || addedIds.has(book.id)}
            className="w-full py-2 rounded-xl text-xs font-bold"
            style={{
              background: addedIds.has(book.id) ? "#aaa" : t.accent,
              color: "#fff",
            }}>
            {adding === book.id
              ? "..."
              : addedIds.has(book.id)
                ? "✓ Added"
                : "+ Add"}
          </button>

        </div>

      ))}

    </div>

  </main>

  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white text-sm"
        style={{ background: t.accent }}>
        {toast}
      </motion.div>
    )}
  </AnimatePresence>

</div>


);
}
