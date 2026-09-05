-- ============================================================
-- Migration: personal book library (Amazon CSV import)
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

create table if not exists public.library_books (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  asin             text not null,                -- ISBN / ASIN (Amazon ID)
  link             text,
  acquired_date    date,
  ownership        text,                          -- Purchase, KindleUnlimited, Sample, Prime, ...
  source           text,
  format           text,                          -- Kindle eBook, Audible Audiobook, Paperback, ...
  origin           text,
  title            text not null,
  pages            integer,
  listening_length text,                          -- raw string, e.g. "11 hours and 28 minutes"
  genres           text[] default '{}',
  series_position  integer,
  series           text,
  first_author     text,
  all_authors      text[] default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (user_id, asin)
);

create trigger library_books_updated_at
  before update on public.library_books
  for each row execute function update_updated_at();

-- RLS
alter table public.library_books enable row level security;

create policy "Users read own library books"
  on public.library_books for select
  using (auth.uid() = user_id);

create policy "Users insert own library books"
  on public.library_books for insert
  with check (auth.uid() = user_id);

create policy "Users update own library books"
  on public.library_books for update
  using (auth.uid() = user_id);

create policy "Users delete own library books"
  on public.library_books for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists library_books_user_title
  on public.library_books(user_id, title);

create index if not exists library_books_user_series
  on public.library_books(user_id, series);

create index if not exists library_books_user_acquired
  on public.library_books(user_id, acquired_date desc);

create index if not exists library_books_genres_gin
  on public.library_books using gin(genres);

create index if not exists library_books_authors_gin
  on public.library_books using gin(all_authors);

-- Full-text search index
create index if not exists library_books_fts
  on public.library_books
  using gin(to_tsvector('english',
    coalesce(title,'') || ' ' || coalesce(series,'') || ' ' || coalesce(first_author,'')));
