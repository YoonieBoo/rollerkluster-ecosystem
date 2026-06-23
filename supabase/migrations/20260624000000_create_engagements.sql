create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  creator_id uuid not null,
  match_score integer default 82,
  status text not null default 'matched',
  created_at timestamptz default now(),
  unique (campaign_id, creator_id)
);

alter table public.engagements enable row level security;

-- Creators can read their own invitations
drop policy if exists "creators_read_own_engagements" on public.engagements;
create policy "creators_read_own_engagements" on public.engagements
for select to authenticated
using (creator_id = auth.uid());

-- Service role (operation dashboard backend) can insert
drop policy if exists "service_role_insert_engagements" on public.engagements;
create policy "service_role_insert_engagements" on public.engagements
for insert to service_role with check (true);

-- Brand/admin users in the ecosystem can also insert
drop policy if exists "brands_insert_engagements" on public.engagements;
create policy "brands_insert_engagements" on public.engagements
for insert to authenticated
with check (
  coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('brand', 'admin')
);
