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

drop policy if exists "creators_read_own_engagements" on public.engagements;
create policy "creators_read_own_engagements" on public.engagements
for select to authenticated
using (creator_id = auth.uid());

drop policy if exists "service_role_insert_engagements" on public.engagements;
create policy "service_role_insert_engagements" on public.engagements
for insert to service_role with check (true);
