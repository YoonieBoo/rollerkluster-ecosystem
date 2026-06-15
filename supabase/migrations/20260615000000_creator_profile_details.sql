alter table public.creator_profiles
add column if not exists creator_name text,
add column if not exists university text,
add column if not exists faculty text,
add column if not exists bio text,
add column if not exists content_categories text[] not null default '{}',
add column if not exists is_scholarship_student boolean not null default false;
