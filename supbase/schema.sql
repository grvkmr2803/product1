-- ═══════════════════════════════════════════════
--  OBSIDIAN / AETHER — Supabase Schema
--  Run this in your Supabase SQL editor
-- ═══════════════════════════════════════════════

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  avatar_url   text,
  mode         text not null default 'obsidian' check (mode in ('obsidian','aether')),
  archetype    text,
  total_books  int not null default 0,
  total_pages  int not null default 0,
  created_at   timestamptz not null default now()
);

-- 2. User books library
create table if not exists public.user_books (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  google_book_id  text not null,
  title           text not null,
  author          text not null,
  cover_url       text,
  status          text not null default 'want_to_read'
                    check (status in ('reading','finished','want_to_read','dnf')),
  progress        int not null default 0 check (progress between 0 and 100),
  rating          int check (rating between 1 and 5),
  note            text,
  trope_tags      text[] not null default '{}',
  vibe_tag        text,
  added_at        timestamptz not null default now(),
  finished_at     timestamptz,
  unique(user_id, google_book_id)
);

-- 3. Row Level Security
alter table public.profiles  enable row level security;
alter table public.user_books enable row level security;

-- Profiles: users can read all, only update their own
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Books: private to each user
create policy "books_select_own"  on public.user_books for select  using (auth.uid() = user_id);
create policy "books_insert_own"  on public.user_books for insert  with check (auth.uid() = user_id);
create policy "books_update_own"  on public.user_books for update  using (auth.uid() = user_id);
create policy "books_delete_own"  on public.user_books for delete  using (auth.uid() = user_id);

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Keep total_books count in sync
create or replace function public.sync_book_count()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set total_books = (
    select count(*) from public.user_books
    where user_id = coalesce(new.user_id, old.user_id)
  )
  where id = coalesce(new.user_id, old.user_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_count_insert on public.user_books;
drop trigger if exists sync_count_delete on public.user_books;
create trigger sync_count_insert after insert on public.user_books
  for each row execute procedure public.sync_book_count();
create trigger sync_count_delete after delete on public.user_books
  for each row execute procedure public.sync_book_count();