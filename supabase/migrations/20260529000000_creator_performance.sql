-- RollerKluster creator performance layer for the existing Supabase schema.
-- Real schema inspection showed:
--   public.users exists and stores platform users/creator profiles.
--   public.campaigns exists with id, name, client_name, status, dates.
--   public.submissions exists with id, campaign_id, creator_ref, submission_link, submitted_at, status.
-- This migration extends those operational tables instead of referencing Prisma model names.

alter table if exists public.users
add column if not exists creator_rank text not null default 'Bronze I';

alter table if exists public.submissions
add column if not exists platform text,
add column if not exists content_url text,
add column if not exists content_type text,
add column if not exists note text,
add column if not exists staff_feedback text,
add column if not exists reviewed_at timestamptz,
add column if not exists approved_at timestamptz,
add column if not exists reviewed_by uuid,
add column if not exists rejected_reason text,
add column if not exists views integer,
add column if not exists impressions integer,
add column if not exists likes integer,
add column if not exists comments integer,
add column if not exists shares integer,
add column if not exists saves integer,
add column if not exists engagement_rate double precision,
add column if not exists cpi_score double precision;

alter table if exists public.submissions
alter column status set default 'pending_review';

update public.submissions
set content_url = coalesce(content_url, submission_link)
where content_url is null;

create index if not exists submissions_creator_ref_submitted_idx
on public.submissions (creator_ref, submitted_at);

create index if not exists submissions_campaign_status_idx
on public.submissions (campaign_id, status);

do $$ begin
  create type creator_performance_rank as enum (
    'bronze_i',
    'bronze_ii',
    'bronze_iii',
    'bronze_iv',
    'silver_i',
    'silver_ii',
    'silver_iii',
    'silver_iv',
    'gold_i',
    'gold_ii',
    'gold_iii',
    'gold_iv',
    'platinum'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.creator_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  creator_ref text not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  total_content_submitted integer not null default 0,
  total_content_approved integer not null default 0,
  total_views integer not null default 0,
  total_impressions integer not null default 0,
  total_likes integer not null default 0,
  total_comments integer not null default 0,
  total_shares integer not null default 0,
  total_saves integer not null default 0,
  average_engagement_rate double precision not null default 0,
  average_cpi_score double precision not null default 0,
  consistency_score double precision not null default 0,
  current_rank creator_performance_rank not null default 'bronze_i',
  next_rank creator_performance_rank null,
  rank_progress_percentage integer not null default 0,
  campaigns_participated text[] not null default '{}',
  staff_notes text null,
  generated_at timestamptz not null default now(),
  unique (creator_ref, month, year)
);

create index if not exists creator_monthly_reports_month_idx
on public.creator_monthly_reports (year, month);

create table if not exists public.creator_rank_history (
  id uuid primary key default gen_random_uuid(),
  creator_ref text not null,
  previous_rank creator_performance_rank not null,
  new_rank creator_performance_rank not null,
  reason text null,
  changed_at timestamptz not null default now()
);

create index if not exists creator_rank_history_creator_idx
on public.creator_rank_history (creator_ref, changed_at);
