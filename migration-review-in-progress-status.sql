-- ============================================================
-- Migration: add "in_progress" book review status
-- Run in Supabase Dashboard → SQL Editor.
-- Adds a status between draft and ready for reviews you're
-- actively writing.
-- ============================================================

alter table public.book_reviews
  drop constraint if exists book_reviews_status_check;

alter table public.book_reviews
  add constraint book_reviews_status_check
  check (status in ('draft', 'in_progress', 'ready', 'posted'));
