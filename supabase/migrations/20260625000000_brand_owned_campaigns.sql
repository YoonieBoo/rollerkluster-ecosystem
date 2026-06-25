alter table if exists public.campaigns
  add column if not exists brand_owner_id uuid references auth.users(id) on delete cascade;

create index if not exists campaigns_brand_owner_id_idx
  on public.campaigns(brand_owner_id);

alter table public.campaigns enable row level security;

drop policy if exists "brands_select_own_campaigns" on public.campaigns;
create policy "brands_select_own_campaigns"
on public.campaigns
for select
to authenticated
using (brand_owner_id = auth.uid());

drop policy if exists "creators_select_invited_campaigns" on public.campaigns;
create policy "creators_select_invited_campaigns"
on public.campaigns
for select
to authenticated
using (
  exists (
    select 1
    from public.engagements
    where engagements.campaign_id = campaigns.id::text
      and engagements.creator_id = auth.uid()
  )
);

drop policy if exists "brands_insert_own_campaigns" on public.campaigns;
create policy "brands_insert_own_campaigns"
on public.campaigns
for insert
to authenticated
with check (
  brand_owner_id = auth.uid()
  and coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('brand', 'admin')
);

drop policy if exists "brands_update_own_campaigns" on public.campaigns;
create policy "brands_update_own_campaigns"
on public.campaigns
for update
to authenticated
using (brand_owner_id = auth.uid())
with check (brand_owner_id = auth.uid());

drop policy if exists "brands_read_own_campaign_engagements" on public.engagements;
create policy "brands_read_own_campaign_engagements"
on public.engagements
for select
to authenticated
using (
  exists (
    select 1
    from public.campaigns
    where campaigns.id::text = engagements.campaign_id
      and campaigns.brand_owner_id = auth.uid()
  )
);

drop policy if exists "brands_insert_engagements" on public.engagements;
create policy "brands_insert_engagements"
on public.engagements
for insert
to authenticated
with check (
  coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('brand', 'admin')
  and exists (
    select 1
    from public.campaigns
    where campaigns.id::text = engagements.campaign_id
      and campaigns.brand_owner_id = auth.uid()
  )
);
