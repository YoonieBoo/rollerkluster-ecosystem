-- Add university and campaign_manager_type columns to public.users
-- and update the shared auth trigger to read and preserve them.
-- Both columns are nullable text; coalesce on conflict so re-login never clobbers an existing value.

alter table public.users
  add column if not exists university             text,
  add column if not exists campaign_manager_type  text;

create or replace function public.handle_rollerkluster_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  users_id_type            text;
  profile_name             text;
  profile_role             text;
  profile_provider         text;
  profile_avatar           text;
  profile_rank             text;
  profile_university       text;
  profile_campaign_mgr     text;
begin
  select data_type into users_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'users'
    and column_name  = 'id';

  profile_name         := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email, 'User');
  profile_role         := case
                            when new.raw_user_meta_data->>'role' in ('creator', 'brand', 'admin')
                            then new.raw_user_meta_data->>'role'
                            else 'brand'
                          end;
  profile_provider     := coalesce(new.raw_app_meta_data->>'provider', 'email');
  profile_avatar       := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
  profile_rank         := coalesce(new.raw_user_meta_data->>'creator_rank', 'Bronze I');
  profile_university   := new.raw_user_meta_data->>'university';
  profile_campaign_mgr := new.raw_user_meta_data->>'campaign_manager_type';

  if users_id_type = 'uuid' then
    insert into public.users (
      id, name, email, full_name, avatar_url, role, provider,
      creator_rank, university, campaign_manager_type,
      created_at, updated_at
    )
    values (
      new.id, profile_name, new.email, profile_name, profile_avatar, profile_role, profile_provider,
      profile_rank, profile_university, profile_campaign_mgr,
      now(), now()
    )
    on conflict (id) do update set
      name                  = excluded.name,
      email                 = excluded.email,
      full_name             = excluded.full_name,
      avatar_url            = coalesce(excluded.avatar_url,            public.users.avatar_url),
      role                  = excluded.role,
      provider              = excluded.provider,
      creator_rank          = coalesce(public.users.creator_rank,          excluded.creator_rank),
      university            = coalesce(public.users.university,            excluded.university),
      campaign_manager_type = coalesce(public.users.campaign_manager_type, excluded.campaign_manager_type),
      updated_at            = now();
  else
    insert into public.users (
      id, name, email, full_name, avatar_url, role, provider,
      creator_rank, university, campaign_manager_type,
      created_at, updated_at
    )
    values (
      new.id::text, profile_name, new.email, profile_name, profile_avatar, profile_role, profile_provider,
      profile_rank, profile_university, profile_campaign_mgr,
      now(), now()
    )
    on conflict (id) do update set
      name                  = excluded.name,
      email                 = excluded.email,
      full_name             = excluded.full_name,
      avatar_url            = coalesce(excluded.avatar_url,            public.users.avatar_url),
      role                  = excluded.role,
      provider              = excluded.provider,
      creator_rank          = coalesce(public.users.creator_rank,          excluded.creator_rank),
      university            = coalesce(public.users.university,            excluded.university),
      campaign_manager_type = coalesce(public.users.campaign_manager_type, excluded.campaign_manager_type),
      updated_at            = now();
  end if;

  return new;
end;
$$;
