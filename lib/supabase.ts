import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types

export type UserBook = {
  id: string
  user_id: string
  google_book_id: string
  title: string
  author: string
  cover_url: string | null
  status: "reading" | "finished" | "want_to_read" | "dnf"
  progress: number
  rating: number | null
  note: string | null
  trope_tags: string[]
  vibe_tag: string | null
  added_at: string
  finished_at: string | null
}

export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  mode: "obsidian" | "aether"
  archetype: string | null
  total_books: number
  total_pages: number
}