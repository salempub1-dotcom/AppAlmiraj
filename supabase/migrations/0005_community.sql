-- Teacher Space ("فضاء الأستاذ") - Phase B: schema + RLS + storage only.
-- This migration is 100% additive. It does NOT alter posts, profiles,
-- products, orders, deliveries, cart or any store/checkout table, column,
-- policy or function. `public.is_admin()` and `public.set_updated_at()`
-- are reused as-is from 0004_content_cms.sql, not redefined here.
--
-- Scope: text/image/pdf/question/idea/exam/test/resource/
-- classroom_experience/tip posts only. No video in V1 (no video columns,
-- no video storage mime types allowed).
--
-- Visibility model: Teacher Space is teacher-only, i.e. every community_*
-- read policy below is granted to `authenticated` only - NOT `anon`. This
-- differs from the public `posts` (official CMS) table on purpose.

-- 1. community_profiles ------------------------------------------------------
-- Public/community extension of `profiles`. `profiles` itself is untouched:
-- no new column, no new policy, no new trigger on `profiles`.
create table if not exists public.community_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  is_public boolean not null default true,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  posts_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists community_profiles_set_updated_at on public.community_profiles;
create trigger community_profiles_set_updated_at
before update on public.community_profiles
for each row execute function public.set_updated_at();

alter table public.community_profiles enable row level security;

drop policy if exists "community_profiles_read" on public.community_profiles;
create policy "community_profiles_read"
on public.community_profiles for select
to authenticated
using (is_public = true or id = auth.uid());

drop policy if exists "community_profiles_own_insert" on public.community_profiles;
create policy "community_profiles_own_insert"
on public.community_profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "community_profiles_own_update" on public.community_profiles;
create policy "community_profiles_own_update"
on public.community_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

grant select, insert, update on public.community_profiles to authenticated;

-- 2. community_posts ---------------------------------------------------------
-- No video type/columns in V1. `media` mirrors the existing posts.media
-- jsonb convention: { type: 'image'|'pdf', path, url, name }.
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'text', 'image', 'pdf', 'question', 'idea',
    'exam', 'test', 'resource', 'classroom_experience', 'tip'
  )),
  title text,
  body text,
  subject text,
  level text[] not null default '{}',
  media jsonb not null default '{}'::jsonb,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  saves_count integer not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_author_idx on public.community_posts (author_id);
create index if not exists community_posts_feed_idx on public.community_posts (status, created_at desc);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
before update on public.community_posts
for each row execute function public.set_updated_at();

alter table public.community_posts enable row level security;

drop policy if exists "community_posts_read_visible" on public.community_posts;
create policy "community_posts_read_visible"
on public.community_posts for select
to authenticated
using (status = 'visible' or author_id = auth.uid());

drop policy if exists "community_posts_admin_read_all" on public.community_posts;
create policy "community_posts_admin_read_all"
on public.community_posts for select
to authenticated
using (public.is_admin());

drop policy if exists "community_posts_own_insert" on public.community_posts;
create policy "community_posts_own_insert"
on public.community_posts for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "community_posts_own_update" on public.community_posts;
create policy "community_posts_own_update"
on public.community_posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "community_posts_admin_update" on public.community_posts;
create policy "community_posts_admin_update"
on public.community_posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "community_posts_own_delete" on public.community_posts;
create policy "community_posts_own_delete"
on public.community_posts for delete
to authenticated
using (author_id = auth.uid());

drop policy if exists "community_posts_admin_delete" on public.community_posts;
create policy "community_posts_admin_delete"
on public.community_posts for delete
to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.community_posts to authenticated;

-- 3. community_likes ----------------------------------------------------------
create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists community_likes_post_idx on public.community_likes (post_id);

alter table public.community_likes enable row level security;

drop policy if exists "community_likes_read_own" on public.community_likes;
create policy "community_likes_read_own"
on public.community_likes for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "community_likes_insert_own" on public.community_likes;
create policy "community_likes_insert_own"
on public.community_likes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "community_likes_delete_own" on public.community_likes;
create policy "community_likes_delete_own"
on public.community_likes for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.community_likes to authenticated;

-- 4. community_saves -----------------------------------------------------------
create table if not exists public.community_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists community_saves_user_idx on public.community_saves (user_id);

alter table public.community_saves enable row level security;

drop policy if exists "community_saves_read_own" on public.community_saves;
create policy "community_saves_read_own"
on public.community_saves for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "community_saves_insert_own" on public.community_saves;
create policy "community_saves_insert_own"
on public.community_saves for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "community_saves_delete_own" on public.community_saves;
create policy "community_saves_delete_own"
on public.community_saves for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.community_saves to authenticated;

-- 5. community_comments ---------------------------------------------------------
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

drop trigger if exists community_comments_set_updated_at on public.community_comments;
create trigger community_comments_set_updated_at
before update on public.community_comments
for each row execute function public.set_updated_at();

alter table public.community_comments enable row level security;

drop policy if exists "community_comments_read_visible" on public.community_comments;
create policy "community_comments_read_visible"
on public.community_comments for select
to authenticated
using (status = 'visible' or author_id = auth.uid());

drop policy if exists "community_comments_admin_read_all" on public.community_comments;
create policy "community_comments_admin_read_all"
on public.community_comments for select
to authenticated
using (public.is_admin());

drop policy if exists "community_comments_own_insert" on public.community_comments;
create policy "community_comments_own_insert"
on public.community_comments for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "community_comments_own_update" on public.community_comments;
create policy "community_comments_own_update"
on public.community_comments for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "community_comments_admin_update" on public.community_comments;
create policy "community_comments_admin_update"
on public.community_comments for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "community_comments_own_delete" on public.community_comments;
create policy "community_comments_own_delete"
on public.community_comments for delete
to authenticated
using (author_id = auth.uid());

drop policy if exists "community_comments_admin_delete" on public.community_comments;
create policy "community_comments_admin_delete"
on public.community_comments for delete
to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.community_comments to authenticated;

-- 6. community_follows -----------------------------------------------------------
create table if not exists public.community_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists community_follows_follower_idx on public.community_follows (follower_id);
create index if not exists community_follows_following_idx on public.community_follows (following_id);

alter table public.community_follows enable row level security;

drop policy if exists "community_follows_read_own" on public.community_follows;
create policy "community_follows_read_own"
on public.community_follows for select
to authenticated
using (follower_id = auth.uid() or following_id = auth.uid());

drop policy if exists "community_follows_insert_own" on public.community_follows;
create policy "community_follows_insert_own"
on public.community_follows for insert
to authenticated
with check (follower_id = auth.uid());

drop policy if exists "community_follows_delete_own" on public.community_follows;
create policy "community_follows_delete_own"
on public.community_follows for delete
to authenticated
using (follower_id = auth.uid());

grant select, insert, delete on public.community_follows to authenticated;

-- 7. community_reports -------------------------------------------------------------
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment', 'profile')),
  target_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_reports_status_idx on public.community_reports (status, created_at);

alter table public.community_reports enable row level security;

drop policy if exists "community_reports_insert_own" on public.community_reports;
create policy "community_reports_insert_own"
on public.community_reports for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "community_reports_admin_read" on public.community_reports;
create policy "community_reports_admin_read"
on public.community_reports for select
to authenticated
using (public.is_admin());

drop policy if exists "community_reports_admin_update" on public.community_reports;
create policy "community_reports_admin_update"
on public.community_reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.community_reports to authenticated;

-- 8. Counter triggers ----------------------------------------------------------
-- Each trigger only performs one narrow, hard-coded increment/decrement.
-- SECURITY DEFINER is required because e.g. a follow written by user A must
-- bump a counter on user B's community_profiles row, which A cannot write
-- to directly under the RLS policies above.

create or replace function public.community_likes_count_sync()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_likes_count_sync on public.community_likes;
create trigger community_likes_count_sync
after insert or delete on public.community_likes
for each row execute function public.community_likes_count_sync();

create or replace function public.community_saves_count_sync()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set saves_count = saves_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts set saves_count = greatest(0, saves_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_saves_count_sync on public.community_saves;
create trigger community_saves_count_sync
after insert or delete on public.community_saves
for each row execute function public.community_saves_count_sync();

create or replace function public.community_comments_count_sync()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_comments_count_sync on public.community_comments;
create trigger community_comments_count_sync
after insert or delete on public.community_comments
for each row execute function public.community_comments_count_sync();

create or replace function public.community_posts_count_sync()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.community_profiles (id, posts_count)
    values (new.author_id, 1)
    on conflict (id) do update set posts_count = public.community_profiles.posts_count + 1;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_profiles set posts_count = greatest(0, posts_count - 1) where id = old.author_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_posts_count_sync on public.community_posts;
create trigger community_posts_count_sync
after insert or delete on public.community_posts
for each row execute function public.community_posts_count_sync();

create or replace function public.community_follows_count_sync()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.community_profiles (id, following_count)
    values (new.follower_id, 1)
    on conflict (id) do update set following_count = public.community_profiles.following_count + 1;
    insert into public.community_profiles (id, followers_count)
    values (new.following_id, 1)
    on conflict (id) do update set followers_count = public.community_profiles.followers_count + 1;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
    update public.community_profiles set followers_count = greatest(0, followers_count - 1) where id = old.following_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists community_follows_count_sync on public.community_follows;
create trigger community_follows_count_sync
after insert or delete on public.community_follows
for each row execute function public.community_follows_count_sync();

-- 9. Safe public teacher profile lookup --------------------------------------
-- Returns ONLY: id, full_name, avatar_url, subject, level, wilaya (from
-- profiles) + bio/counts (from community_profiles), for public profiles
-- only. Never returns phone, notif_prefs, role, email or any other column.
-- Used both for a single profile page (call with a 1-element array) and to
-- batch-resolve author display info for a feed page (call with the page's
-- distinct author ids) without granting any broader read access to
-- `profiles` itself.
create or replace function public.get_public_teacher_profiles(profile_ids uuid[])
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  subject text,
  level text[],
  wilaya text,
  bio text,
  followers_count integer,
  following_count integer,
  posts_count integer
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.id, p.full_name, p.avatar_url, p.subject, p.level, p.wilaya,
    cp.bio, cp.followers_count, cp.following_count, cp.posts_count
  from public.profiles p
  join public.community_profiles cp on cp.id = p.id
  where cp.is_public = true
    and profile_ids is not null
    and p.id = any(profile_ids);
$$;

revoke all on function public.get_public_teacher_profiles(uuid[]) from public, anon;
grant execute on function public.get_public_teacher_profiles(uuid[]) to authenticated;

-- 10. community-media storage bucket -------------------------------------------
-- Image + PDF only in V1 (no video). Public bucket (same model as
-- content-media/product-images: URLs work without a signed-URL round trip),
-- but writes are self-serve per-author-folder, not admin-gated - the
-- opposite write model from content-media, which is why this cannot reuse
-- that bucket. Path convention: community-media/{auth.uid()}/{file}.
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "community_media_public_read" on storage.objects;
create policy "community_media_public_read"
on storage.objects for select
to authenticated
using (bucket_id = 'community-media');

drop policy if exists "community_media_own_insert" on storage.objects;
create policy "community_media_own_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (metadata->>'mimetype') in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf')
);

drop policy if exists "community_media_own_update" on storage.objects;
create policy "community_media_own_update"
on storage.objects for update
to authenticated
using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "community_media_own_delete" on storage.objects;
create policy "community_media_own_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "community_media_admin_delete" on storage.objects;
create policy "community_media_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'community-media' and public.is_admin());
