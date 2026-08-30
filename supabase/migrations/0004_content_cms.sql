-- Content Management System for non-store content (posts table).
-- This migration does NOT touch products, orders, deliveries or any store/checkout logic.

-- 1. Bilingual optional fields for admin-authored content -------------------
alter table public.posts add column if not exists title_en text;
alter table public.posts add column if not exists body_en text;
alter table public.posts add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- 2. Publication status model: draft / published / hidden -------------------
-- Existing values (pending/approved/rejected) are remapped 1:1 so no content
-- is lost or reinterpreted:
--   pending  -> draft      (not yet visible to teachers)
--   approved -> published  (was publicly visible, stays publicly visible)
--   rejected -> hidden     (was not publicly visible, stays not visible)
alter table public.posts drop constraint if exists posts_status_check;

update public.posts
set status = case status
  when 'pending' then 'draft'
  when 'approved' then 'published'
  when 'rejected' then 'hidden'
  else status
end
where status in ('pending', 'approved', 'rejected');

alter table public.posts alter column status set default 'draft';

alter table public.posts
  add constraint posts_status_check
  check (status in ('draft', 'published', 'hidden'));

comment on column public.posts.status is 'draft: admin-only. published: publicly visible. hidden: unpublished, admin-only.';

-- posts.updated_at existed but had no trigger keeping it fresh - add it,
-- reusing the same set_updated_at() helper used by public.profiles.
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- 3. Admin role helper --------------------------------------------------
-- Central, reusable check so RLS policies (table + storage) stay in sync.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 4. posts RLS: public read of published content + full admin management ---
drop policy if exists "posts_public_read_approved" on public.posts;

create policy "posts_public_read_published"
on public.posts for select
to anon, authenticated
using (status = 'published');

create policy "posts_admin_select_all"
on public.posts for select
to authenticated
using (public.is_admin());

create policy "posts_admin_insert"
on public.posts for insert
to authenticated
with check (public.is_admin());

create policy "posts_admin_update"
on public.posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "posts_admin_delete"
on public.posts for delete
to authenticated
using (public.is_admin());

grant insert, update, delete on public.posts to authenticated;

-- 5. Storage bucket for cover images / PDFs / resource files ---------------
-- Single public bucket, folders: covers/<postId>/..., files/<postId>/...
-- Binary content never touches the database - only the resulting public
-- URL/path is stored in posts.media (jsonb).
insert into storage.buckets (id, name, public)
values ('content-media', 'content-media', true)
on conflict (id) do nothing;

drop policy if exists "content_media_public_read" on storage.objects;
create policy "content_media_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'content-media');

drop policy if exists "content_media_admin_insert" on storage.objects;
create policy "content_media_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'content-media' and public.is_admin());

drop policy if exists "content_media_admin_update" on storage.objects;
create policy "content_media_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'content-media' and public.is_admin())
with check (bucket_id = 'content-media' and public.is_admin());

drop policy if exists "content_media_admin_delete" on storage.objects;
create policy "content_media_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'content-media' and public.is_admin());
