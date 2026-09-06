-- ============================================================
-- Migration: book review genre
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

alter table public.book_reviews
  add column if not exists genre text;
