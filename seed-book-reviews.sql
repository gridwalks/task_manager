-- ============================================================
-- Seed: sample book review
-- Run in Supabase Dashboard → SQL Editor AFTER the book_reviews
-- section of supabase-schema.sql.
-- Replace the email below with your login email if different.
-- Script body is stored as rich-text HTML (matches the editor).
-- ============================================================

insert into public.book_reviews
  (user_id, review_date, title, author, series_position, rating, status, notes, script)
select
  id,
  current_date,
  'Web of Vows and Vengeance',
  'Aria Ashbrook',
  'The Hirathean Path #1',
  5,
  'ready',
  'Author ''Aria Ashbrook'' is a shared pen name of authors Heather G. Harris and Hannah Lynn. Approved sample script - kept as-is.',
  '<p>[HOOK - hold the book up to camera]<br>Okay, so this book left me on the floor and I need to talk about it immediately.</p>'
  || '<p>[cut - walking, casual]<br>Web of Vows and Vengeance by Aria Ashbrook. If you loved Fourth Wing or ACOTAR, stop scrolling - this is your next obsession.</p>'
  || '<p>[cut - leaning in]<br>Here''s the setup. Our girl Rose had everything. Then Prince Kyor twisted the truth about his own mother''s death, and SHE paid for it. Her family? Stripped of their magic. Cast into the slums. Her parents, gone. And now her little sister is dying.</p>'
  || '<p>[beat]<br>Her one shot to fix it? Win the Tournament of the Gifting - a brutal, deadly competition where the prize is a blessing from the goddess of life herself.</p>'
  || '<p>[cut - wide eyes]<br>The catch? Every other contender still has the magic she got robbed of. And Kyor is in the arena too... and he doesn''t just want to win. He wants her DEAD.</p>'
  || '<p>[cut - fanning self]<br>It''s a Nordic-inspired world, slow-burn enemies-to-lovers, deadly trials, gods and goddesses, sisterhood, found family - and a heroine who refuses to stay broken.</p>'
  || '<p>[serious for a sec]<br>Real talk: check the content warnings before you dive in. This one gets dark, and that ending? I was NOT okay.</p>'
  || '<p>[final beat - clutching book]<br>Five stars. It won Best Fantasy Read at Pascify Con this year and I get why. Go read it, then come cry with me in the comments.</p>'
  || '<p>[end card]<br>Book two is out - you''re welcome.</p>'
from auth.users
where email = 'chris@genthq.com';
