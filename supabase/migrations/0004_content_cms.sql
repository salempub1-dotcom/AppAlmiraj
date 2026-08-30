-- Content Management System for non-store content (posts table).
-- This migration does NOT touch products, orders, deliveries or any store/checkout logic.
-- IMPORTANT: keep the existing DB status values (pending/approved/rejected) for
-- backward compatibility with already-installed app builds and existing server code.

-- 1. Bilingual optional fields for admin-authored content -------------------
alter table public.posts add column if not exists title_en text;
alter table public.posts add column if not exists body_en text;
alter table public.posts add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- posts.updated_at existed but had no trigger keeping it fresh - add it,
-- reusing the same set_updated_at() helper used by public.profiles.
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- 2. Admin role helper -------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. posts RLS: preserve legacy public-read semantics + admin management ----
-- Recreate policies defensively so this migration is safe to re-run.
drop policy if exists "posts_public_read_published" on public.posts;
drop policy if exists "posts_public_read_approved" on public.posts;
create policy "posts_public_read_approved"
on public.posts for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "posts_admin_select_all" on public.posts;
create policy "posts_admin_select_all"
on public.posts for select
to authenticated
using (public.is_admin());

drop policy if exists "posts_admin_insert" on public.posts;
create policy "posts_admin_insert"
on public.posts for insert
to authenticated
with check (public.is_admin());

drop policy if exists "posts_admin_update" on public.posts;
create policy "posts_admin_update"
on public.posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "posts_admin_delete" on public.posts;
create policy "posts_admin_delete"
on public.posts for delete
to authenticated
using (public.is_admin());

grant insert, update, delete on public.posts to authenticated;

-- 4. Storage bucket for cover images / PDFs / resource files ---------------
-- The content in this CMS is intentionally free/public teacher content.
-- Paths are randomised; draft/hidden means "not listed in the app", not a
-- confidential file vault. Binary content never touches Postgres.
insert into storage.buckets (id, name, public)
values ('content-media', 'content-media', true)
on conflict (id) do update set public = excluded.public;

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
