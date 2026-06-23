-- Supabase Auth owns email uniqueness. A stale public.users row with the same
-- email can make the auth.users trigger fail with "Database error saving new user".
alter table public.users
  drop constraint if exists users_email_key;

drop index if exists public.users_email_key;
