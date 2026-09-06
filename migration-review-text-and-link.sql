-- ============================================================
-- Migration: book review text + Amazon affiliate link
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

alter table public.book_reviews
  add column if not exists review_text text default '',  -- rich-text HTML, same format as script
  add column if not exists amazon_link text;
