-- Allow brand/admin accounts to read signed-up creator directory data for discovery and campaign invites.

create or replace function public.current_user_is_brand_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id::text = auth.uid()::text
      and role in ('brand', 'admin')
  )
  or coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('brand', 'admin');
$$;

drop policy if exists "creator_profiles_select_brand_directory" on public.creator_profiles;
create policy "creator_profiles_select_brand_directory"
on public.creator_profiles
for select
to authenticated
using (
  onboarding_completed = true
  and public.current_user_is_brand_or_admin()
);

drop policy if exists "users_select_creator_directory_for_brands" on public.users;
create policy "users_select_creator_directory_for_brands"
on public.users
for select
to authenticated
using (
  role = 'creator'
  and public.current_user_is_brand_or_admin()
);
