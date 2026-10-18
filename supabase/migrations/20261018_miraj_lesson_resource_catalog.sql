-- Al Miraj: standalone, additive lesson/resource catalog for first-year primary.
-- Does not touch existing content, teacher records, or storage.
create table if not exists public.miraj_lessons (
  id uuid primary key default gen_random_uuid(),
  level_code text not null,
  subject_code text not null,
  sequence_no integer,
  lesson_no integer,
  title_ar text not null,
  slug text not null unique,
  publication_status text not null default 'draft' check (publication_status in ('draft','review','published','archived')),
  curriculum_year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(level_code,subject_code,sequence_no,lesson_no)
);
create table if not exists public.miraj_learning_resources (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  resource_kind text not null check (resource_kind in ('lesson_plan','worksheet','visual_aid','game','official_reference','editable','audio','video','other')),
  file_format text,
  source_provider text not null default 'google_drive',
  source_file_id text,
  source_url text,
  access_mode text not null default 'external' check (access_mode in ('external','public','private')),
  publication_status text not null default 'draft' check (publication_status in ('draft','review','published','archived')),
  verification_status text not null default 'unreviewed' check (verification_status in ('unreviewed','verified','outdated','rejected')),
  is_official boolean not null default false,
  curriculum_year text,
  note text,
  created_at timestamptz not null default now(),
  unique(source_provider,source_file_id),
  check (source_url is null or source_url ~ '^https://')
);
create table if not exists public.miraj_lesson_resources (
  lesson_id uuid not null references public.miraj_lessons(id) on delete cascade,
  resource_id uuid not null references public.miraj_learning_resources(id) on delete cascade,
  display_order integer not null default 0,
  primary key(lesson_id, resource_id)
);
create index if not exists miraj_lessons_lookup_idx on public.miraj_lessons(level_code, subject_code, sequence_no, lesson_no);
create index if not exists miraj_resources_status_idx on public.miraj_learning_resources(publication_status, resource_kind);
create index if not exists miraj_lesson_resources_order_idx on public.miraj_lesson_resources(lesson_id,display_order);

alter table public.miraj_lessons enable row level security;
alter table public.miraj_learning_resources enable row level security;
alter table public.miraj_lesson_resources enable row level security;

-- Read only published lessons with verified, published resource metadata.
-- Writes are reserved for trusted server processes using service_role, not mobile clients.
revoke all on public.miraj_lessons, public.miraj_learning_resources, public.miraj_lesson_resources from anon, authenticated;
grant select on public.miraj_lessons, public.miraj_learning_resources, public.miraj_lesson_resources to authenticated;

create policy "miraj_lessons_read_published" on public.miraj_lessons
  for select to authenticated using (publication_status = 'published');
create policy "miraj_resources_read_verified" on public.miraj_learning_resources
  for select to authenticated using (publication_status = 'published' and verification_status = 'verified');
create policy "miraj_links_read_published" on public.miraj_lesson_resources
  for select to authenticated using (
    exists(select 1 from public.miraj_lessons l where l.id=lesson_id and l.publication_status='published')
    and exists(select 1 from public.miraj_learning_resources r where r.id=resource_id and r.publication_status='published' and r.verification_status='verified')
  );

-- Seed as drafts: observed metadata only. Never label resources as officially current before review.
insert into public.miraj_lessons (level_code,subject_code,sequence_no,lesson_no,title_ar,slug,publication_status)
values
 ('1AP','mathematics',1,1,'الأعداد من 1 إلى 5 (1)','1ap-math-01-01','draft'),
 ('1AP','mathematics',1,2,'تعيين موقع في الفضاء (1)','1ap-math-01-02','draft'),
 ('1AP','mathematics',5,52,'متمم عدد إلى العشرة الموالية','1ap-math-05-52','draft')
on conflict (slug) do nothing;

insert into public.miraj_learning_resources (title_ar,resource_kind,file_format,source_provider,source_file_id,source_url,publication_status,verification_status,note)
values
 ('مذكرة الأعداد من 1 إلى 5 (1)','lesson_plan','pdf','google_drive','1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp','https://drive.google.com/file/d/1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp/view','draft','unreviewed','فُحص نصها؛ مراجعة التوافق مع 2026–2027 مطلوبة'),
 ('مذكرة تعيين موقع في الفضاء (1)','lesson_plan','pdf','google_drive','16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7','https://drive.google.com/file/d/16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7/view','draft','unreviewed','فهرسة أولية'),
 ('مذكرة متمم عدد إلى العشرة الموالية','lesson_plan','pdf','google_drive','1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO','https://drive.google.com/file/d/1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO/view','draft','unreviewed','رُصد ملف آخر مماثل باسم (1)، يمنع نشر نسختين دون التحقق')
on conflict (source_provider,source_file_id) do nothing;

insert into public.miraj_lesson_resources(lesson_id,resource_id)
select l.id,r.id from public.miraj_lessons l
join public.miraj_learning_resources r on
 (l.slug='1ap-math-01-01' and r.source_file_id='1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp') or
 (l.slug='1ap-math-01-02' and r.source_file_id='16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7') or
 (l.slug='1ap-math-05-52' and r.source_file_id='1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO')
on conflict do nothing;
