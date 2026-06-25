create or replace function public.current_user_is_campaign_manager()
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
      and role in ('admin', 'campaign_manager', 'operation', 'operations')
  )
  or coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('admin', 'campaign_manager', 'operation', 'operations');
$$;

drop policy if exists "campaign_managers_select_all_campaigns" on public.campaigns;
create policy "campaign_managers_select_all_campaigns"
on public.campaigns
for select
to authenticated
using (public.current_user_is_campaign_manager());

drop policy if exists "campaign_managers_update_all_campaigns" on public.campaigns;
create policy "campaign_managers_update_all_campaigns"
on public.campaigns
for update
to authenticated
using (public.current_user_is_campaign_manager())
with check (public.current_user_is_campaign_manager());

drop policy if exists "campaign_managers_insert_campaigns" on public.campaigns;
create policy "campaign_managers_insert_campaigns"
on public.campaigns
for insert
to authenticated
with check (public.current_user_is_campaign_manager());

drop policy if exists "campaign_managers_select_all_engagements" on public.engagements;
create policy "campaign_managers_select_all_engagements"
on public.engagements
for select
to authenticated
using (public.current_user_is_campaign_manager());

drop policy if exists "campaign_managers_update_all_engagements" on public.engagements;
create policy "campaign_managers_update_all_engagements"
on public.engagements
for update
to authenticated
using (public.current_user_is_campaign_manager())
with check (public.current_user_is_campaign_manager());

drop policy if exists "campaign_managers_insert_engagements" on public.engagements;
create policy "campaign_managers_insert_engagements"
on public.engagements
for insert
to authenticated
with check (public.current_user_is_campaign_manager());
