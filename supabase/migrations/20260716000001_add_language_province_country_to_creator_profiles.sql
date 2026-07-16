alter table public.creator_profiles
  add column if not exists language text,
  add column if not exists province text,
  add column if not exists country  text;
