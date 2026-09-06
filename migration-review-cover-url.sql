-- ============================================================
-- Migration: auto-fetched book cover URL
-- Run in Supabase Dashboard → SQL Editor.
-- cover_path (Supabase Storage, private) stays the manual-upload
-- path and always wins when set. cover_url holds an external
-- thumbnail auto-fetched from the Google Books API for new
-- reviews that haven't had a cover manually uploaded.
-- ============================================================

alter table public.book_reviews
  add column if not exists cover_url text;
