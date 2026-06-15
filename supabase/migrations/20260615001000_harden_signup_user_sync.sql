-- Keep Supabase Auth signup in sync with the public users shape used by the app.

create table if not exists public.users (
  id uuid primary key,
  name text not null,
  email text not null,
  role text not null default 'brand',
  creator_rank text not null default 'Bronze I',
  full_name text,
  avatar_url text,
  provider text,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
add column if not exists name text,
add column if not exists email text,
add column if not exists full_name text,
add column if not exists avatar_url text,
add column if not exists role text not null default 'brand',
add column if not exists provider text,
add column if not exists creator_rank text not null default 'Bronze I',
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz not null default now();

update public.users
set
  name = coalesce(nullif(name, ''), nullif(full_name, ''), nullif(email, ''), 'User'),
  role = coalesce(nullif(role, ''), 'brand'),
  creator_rank = coalesce(nullif(creator_rank, ''), 'Bronze I'),
  updated_at = coalesce(updated_at, now())
where
  name is null
  or name = ''
  or role is null
  or role = ''
  or creator_rank is null
  or creator_rank = ''
  or updated_at is null;

alter table public.users
alter column name set not null,
alter column role set default 'brand',
alter column creator_rank set default 'Bronze I',
alter column creator_rank set not null,
alter column updated_at set default now(),
alter column updated_at set not null;

create or replace function public.handle_rollerkluster_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  users_id_type text;
  profile_name text;
  profile_role text;
  profile_provider text;
  profile_avatar text;
  profile_rank text;
begin
  select data_type into users_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'id';

  profile_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email, 'User');
  profile_role := case
    when new.raw_user_meta_data->>'role' in ('creator', 'brand', 'admin') then new.raw_user_meta_data->>'role'
    else 'brand'
  end;
  profile_provider := coalesce(new.raw_app_meta_data->>'provider', 'email');
  profile_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
  profile_rank := coalesce(new.raw_user_meta_data->>'creator_rank', 'Bronze I');

  if users_id_type = 'uuid' then
    insert into public.users (id, name, email, full_name, avatar_url, role, provider, creator_rank, created_at, updated_at)
    values (new.id, profile_name, new.email, profile_name, profile_avatar, profile_role, profile_provider, profile_rank, now(), now())
    on conflict (id) do update set
      name = excluded.name,
      email = excluded.email,
      full_name = excluded.full_name,
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      role = excluded.role,
      provider = excluded.provider,
      creator_rank = coalesce(public.users.creator_rank, excluded.creator_rank),
      updated_at = now();
  else
    insert into public.users (id, name, email, full_name, avatar_url, role, provider, creator_rank, created_at, updated_at)
    values (new.id::text, profile_name, new.email, profile_name, profile_avatar, profile_role, profile_provider, profile_rank, now(), now())
    on conflict (id) do update set
      name = excluded.name,
      email = excluded.email,
      full_name = excluded.full_name,
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      role = excluded.role,
      provider = excluded.provider,
      creator_rank = coalesce(public.users.creator_rank, excluded.creator_rank),
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rollerkluster on auth.users;
create trigger on_auth_user_created_rollerkluster
after insert or update on auth.users
for each row execute function public.handle_rollerkluster_auth_user();
