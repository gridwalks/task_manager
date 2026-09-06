-- ============================================================
-- Migration: book review spice level
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

alter table public.book_reviews
  add column if not exists spice_level smallint check (spice_level between 1 and 5);
