-- RollerKluster real auth and creator onboarding support.
-- Extends public.users for Supabase Auth identities and stores creator social proof in creator_profiles.

alter table if exists public.users
add column if not exists email text,
add column if not exists full_name text,
add column if not exists avatar_url text,
add column if not exists role text,
add column if not exists provider text,
add column if not exists updated_at timestamptz not null default now();

alter table if exists public.users
add column if not exists created_at timestamptz not null default now();

do $$ begin
  execute 'alter table public.users enable row level security';
exception
  when undefined_table then null;
end $$;

do $$ begin
  execute 'drop policy if exists "users_select_own" on public.users';
  execute 'create policy "users_select_own" on public.users for select to authenticated using (id::text = auth.uid()::text)';
exception
  when undefined_table then null;
end $$;

do $$ begin
  execute 'drop policy if exists "users_insert_own" on public.users';
  execute 'create policy "users_insert_own" on public.users for insert to authenticated with check (id::text = auth.uid()::text)';
exception
  when undefined_table then null;
end $$;

do $$ begin
  execute 'drop policy if exists "users_update_own" on public.users';
  execute 'create policy "users_update_own" on public.users for update to authenticated using (id::text = auth.uid()::text) with check (id::text = auth.uid()::text)';
exception
  when undefined_table then null;
end $$;

create or replace function public.handle_rollerkluster_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  users_id_type text;
  profile_role text;
begin
  select data_type into users_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'id';

  profile_role := coalesce(new.raw_user_meta_data->>'role', 'brand');

  if users_id_type = 'uuid' then
    execute '
      insert into public.users (id, email, full_name, avatar_url, role, provider, created_at, updated_at)
      values ($1, $2, $3, $4, $5, $6, now(), now())
      on conflict (id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        role = excluded.role,
        provider = excluded.provider,
        updated_at = now()
    '
    using
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
      new.raw_user_meta_data->>'avatar_url',
      profile_role,
      coalesce(new.raw_app_meta_data->>'provider', 'email');
  else
    execute '
      insert into public.users (id, email, full_name, avatar_url, role, provider, created_at, updated_at)
      values ($1, $2, $3, $4, $5, $6, now(), now())
      on conflict (id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        role = excluded.role,
        provider = excluded.provider,
        updated_at = now()
    '
    using
      new.id::text,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
      new.raw_user_meta_data->>'avatar_url',
      profile_role,
      coalesce(new.raw_app_meta_data->>'provider', 'email');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rollerkluster on auth.users;
create trigger on_auth_user_created_rollerkluster
after insert or update on auth.users
for each row execute function public.handle_rollerkluster_auth_user();

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'creator',
  platform text not null,
  social_handle text not null,
  social_profile_url text not null,
  follower_count integer not null default 0 check (follower_count >= 0),
  engagement_rate numeric null,
  proof_image_url text not null,
  verification_status text not null default 'pending_review',
  creator_rank text not null default 'Bronze I',
  onboarding_completed boolean not null default false,
  detected_follower_count integer null,
  manual_follower_count integer null,
  verification_notes text null,
  verified_by uuid null references auth.users(id),
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

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
