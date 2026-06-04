-- Fix/ensure creator onboarding persistence table exists for Supabase Auth users.
-- Onboarding reads/writes public.creator_profiles using user_id = auth.users.id.

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  social_handle text not null,
  social_profile_url text,
  follower_count integer not null default 0 check (follower_count >= 0),
  engagement_rate numeric,
  proof_image_url text,
  verification_status text not null default 'pending_review',
  creator_rank text not null,
  onboarding_completed boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

alter table public.creator_profiles
add column if not exists platform text,
add column if not exists social_handle text,
add column if not exists social_profile_url text,
add column if not exists follower_count integer not null default 0,
add column if not exists engagement_rate numeric,
add column if not exists proof_image_url text,
add column if not exists verification_status text not null default 'pending_review',
add column if not exists creator_rank text not null default 'Bronze I',
add column if not exists onboarding_completed boolean not null default true,
add column if not exists detected_follower_count integer,
add column if not exists manual_follower_count integer,
add column if not exists verification_notes text,
add column if not exists verified_by uuid references auth.users(id),
add column if not exists verified_at timestamptz,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

create index if not exists creator_profiles_user_idx
on public.creator_profiles (user_id);

alter table public.creator_profiles enable row level security;

drop policy if exists "creator_profiles_select_own" on public.creator_profiles;
create policy "creator_profiles_select_own"
on public.creator_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "creator_profiles_insert_own" on public.creator_profiles;
create policy "creator_profiles_insert_own"
on public.creator_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "creator_profiles_update_own" on public.creator_profiles;
create policy "creator_profiles_update_own"
on public.creator_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('creator-social-proof', 'creator-social-proof', false)
on conflict (id) do nothing;

drop policy if exists "creator_social_proof_upload_own" on storage.objects;
create policy "creator_social_proof_upload_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'creator-social-proof'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "creator_social_proof_read_own" on storage.objects;
create policy "creator_social_proof_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'creator-social-proof'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "creator_social_proof_update_own" on storage.objects;
create policy "creator_social_proof_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'creator-social-proof'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'creator-social-proof'
  and (storage.foldername(name))[1] = auth.uid()::text
);
