create or replace function public.creator_has_campaign_invite(campaign_id_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.engagements
    where engagements.campaign_id = campaign_id_input
      and engagements.creator_id = auth.uid()
  );
$$;

create or replace function public.current_user_owns_campaign(campaign_id_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns
    where campaigns.id::text = campaign_id_input
      and campaigns.brand_owner_id = auth.uid()
  );
$$;

drop policy if exists "creators_select_invited_campaigns" on public.campaigns;
create policy "creators_select_invited_campaigns"
on public.campaigns
for select
to authenticated
using (public.creator_has_campaign_invite(id::text));

drop policy if exists "brands_read_own_campaign_engagements" on public.engagements;
create policy "brands_read_own_campaign_engagements"
on public.engagements
for select
to authenticated
using (public.current_user_owns_campaign(campaign_id));

drop policy if exists "brands_insert_engagements" on public.engagements;
create policy "brands_insert_engagements"
on public.engagements
for insert
to authenticated
with check (
  coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('brand', 'admin')
  and public.current_user_owns_campaign(campaign_id)
);
