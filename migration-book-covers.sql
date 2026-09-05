-- ============================================================
-- Migration: book covers
-- Run in Supabase Dashboard → SQL Editor.
-- Adds a cover_path column to book_reviews and a private
-- book-covers storage bucket (images only, 5 MB max).
-- ============================================================

alter table public.book_reviews
  add column if not exists cover_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  false,
  5242880,  -- 5 MB per file
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Users can manage covers inside their own folder (path starts with their user_id)
drop policy if exists "Users upload own book covers" on storage.objects;
create policy "Users upload own book covers"
  on storage.objects for insert
  with check (
    bucket_id = 'book-covers'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

drop policy if exists "Users read own book covers" on storage.objects;
create policy "Users read own book covers"
  on storage.objects for select
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

drop policy if exists "Users delete own book covers" on storage.objects;
create policy "Users delete own book covers"
  on storage.objects for delete
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
