create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  post_type text not null check (post_type in ('video','article','teacher_tip','question','poll','exam','test','resource','announcement')),
  title text not null,
  body text,
  subject text,
  level text,
  term text,
  sequence text,
  media jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_official boolean not null default false,
  helpful_count integer not null default 0 check (helpful_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_published_idx on public.posts(status, published_at desc);
create index if not exists posts_type_status_idx on public.posts(post_type, status);
create index if not exists posts_subject_level_idx on public.posts(subject, level);

alter table public.posts enable row level security;

revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;

create policy "posts_public_read_approved"
on public.posts for select
to anon, authenticated
using (status = 'approved');

-- V1 content is published only from trusted server/admin paths.
-- Teacher-created posts and moderation policies are intentionally deferred to the Community phase.
