create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text,
  auth text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.push_subscriptions
  add column if not exists creator_id uuid references auth.users(id) on delete cascade;

create index if not exists push_subscriptions_creator_id_idx on public.push_subscriptions(creator_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "creators_insert_own_push_subscriptions" on public.push_subscriptions;
create policy "creators_insert_own_push_subscriptions" on public.push_subscriptions
for insert to authenticated
with check (creator_id = auth.uid());

drop policy if exists "creators_update_own_push_subscriptions" on public.push_subscriptions;
create policy "creators_update_own_push_subscriptions" on public.push_subscriptions
for update to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());
