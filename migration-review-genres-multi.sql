-- ============================================================
-- Migration: multiple genres per book review
-- Run in Supabase Dashboard → SQL Editor.
-- Replaces the single "genre" text column with a "genres" text[]
-- array. Safe whether or not you already ran the earlier
-- migration-review-genre.sql — migrates any existing genre value
-- into the new array, then drops the old column.
-- ============================================================

alter table public.book_reviews
  add column if not exists genres text[] default '{}';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'book_reviews' and column_name = 'genre'
  ) then
    update public.book_reviews
      set genres = array[genre]
      where genre is not null and (genres is null or genres = '{}');
    alter table public.book_reviews drop column genre;
  end if;
end $$;
