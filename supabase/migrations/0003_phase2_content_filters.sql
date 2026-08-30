alter table public.posts
  drop constraint if exists posts_post_type_check;

alter table public.posts
  add constraint posts_post_type_check
  check (post_type in ('video','article','teacher_tip','problem','question','poll','exam','test','resource','announcement'));

create index if not exists posts_level_status_idx on public.posts(level, status);
create index if not exists posts_term_status_idx on public.posts(term, status);
create index if not exists posts_title_search_idx on public.posts using gin (to_tsvector('simple', coalesce(title, '')));

comment on table public.posts is 'Public educational content feed for Al Miraj Education. Paid product contents are not stored here.';
