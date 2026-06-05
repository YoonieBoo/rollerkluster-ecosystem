-- Persistent creator profile photos.
-- Uploaded avatars are stored in Supabase Storage and the public URL is saved
-- to public.users.avatar_url so creators do not need to re-upload after login.

insert into storage.buckets (id, name, public)
values ('creator-avatars', 'creator-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "creator_avatars_upload_own" on storage.objects;
create policy "creator_avatars_upload_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'creator-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "creator_avatars_update_own" on storage.objects;
create policy "creator_avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'creator-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'creator-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "creator_avatars_read_public" on storage.objects;
create policy "creator_avatars_read_public"
on storage.objects
for select
to public
using (bucket_id = 'creator-avatars');
