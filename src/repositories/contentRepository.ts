import { supabase } from '../services/supabase';

export type PostType =
  | 'video'
  | 'article'
  | 'teacher_tip'
  | 'problem'
  | 'question'
  | 'poll'
  | 'exam'
  | 'test'
  | 'resource'
  | 'announcement';

// The content types exposed in the admin Content Manager. `question` and
// `poll` remain valid values in the database for backward compatibility but
// are not part of the CMS content model described by the product spec.
export const ADMIN_POST_TYPES: PostType[] = [
  'video',
  'test',
  'exam',
  'resource',
  'teacher_tip',
  'problem',
  'article',
  'announcement'
];

export type EducationalLevel = '3PS' | '4PS' | '5PS' | '1MS' | '2MS' | '3MS' | '4MS';
export const EDUCATIONAL_LEVELS: EducationalLevel[] = ['3PS', '4PS', '5PS', '1MS', '2MS', '3MS', '4MS'];

// Keep the database's original status vocabulary for backward compatibility.
// The admin UI presents these as Draft / Published / Hidden.
export type PostStatus = 'pending' | 'approved' | 'rejected';
export const POST_STATUSES: PostStatus[] = ['pending', 'approved', 'rejected'];

export type ContentMedia = {
  cover_url?: string;
  cover_path?: string;
  youtube_url?: string;
  video_url?: string;
  file_url?: string;
  file_path?: string;
  file_name?: string;
};

export type ContentPost = {
  id: string;
  post_type: PostType;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  subject: string | null;
  level: string | null;
  term: string | null;
  sequence: string | null;
  media: ContentMedia;
  is_official: boolean;
  status: PostStatus;
  helpful_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentFilters = {
  postType?: PostType;
  search?: string;
  subject?: string;
  level?: string;
  term?: string;
  limit?: number;
};

export type AdminContentFilters = ContentFilters & {
  status?: PostStatus;
  sequence?: string;
};

export type ContentInput = {
  post_type: PostType;
  title: string;
  title_en?: string | null;
  body?: string | null;
  body_en?: string | null;
  subject?: string | null;
  level?: string | null;
  term?: string | null;
  sequence?: string | null;
  media?: ContentMedia;
  is_official?: boolean;
  status?: PostStatus;
  published_at?: string | null;
};

const selectFields =
  'id,post_type,title,title_en,body,body_en,subject,level,term,sequence,media,is_official,status,helpful_count,published_at,created_at,updated_at';

// ---------------------------------------------------------------------------
// Public (teacher-facing) reads keep the legacy `approved` value so older
// installed app builds and existing server code continue to work.
// ---------------------------------------------------------------------------
export const contentRepository = {
  async getLatest(limit = 8) {
    return supabase
      .from('posts')
      .select(selectFields)
      .eq('status', 'approved')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
  },

  async getByType(postType: PostType, limit = 30) {
    return supabase
      .from('posts')
      .select(selectFields)
      .eq('status', 'approved')
      .eq('post_type', postType)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
  },

  async getById(id: string) {
    return supabase
      .from('posts')
      .select(selectFields)
      .eq('status', 'approved')
      .eq('id', id)
      .single();
  },

  async explore(filters: ContentFilters = {}) {
    let query = supabase
      .from('posts')
      .select(selectFields)
      .eq('status', 'approved')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (filters.postType) query = query.eq('post_type', filters.postType);
    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.level) query = query.eq('level', filters.level);
    if (filters.term) query = query.eq('term', filters.term);

    const search = filters.search?.trim();
    if (search) query = query.ilike('title', `%${search}%`);

    return query.limit(filters.limit ?? 40);
  }
};

// ---------------------------------------------------------------------------
// Admin-only reads/writes. RLS (public.is_admin()) is the real gate; the app
// additionally hides the entry point from non-admins (see useIsAdmin).
// ---------------------------------------------------------------------------
export const adminContentRepository = {
  async listAll(filters: AdminContentFilters = {}) {
    let query = supabase
      .from('posts')
      .select(selectFields)
      .order('updated_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.postType) query = query.eq('post_type', filters.postType);
    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.level) query = query.eq('level', filters.level);
    if (filters.term) query = query.eq('term', filters.term);
    if (filters.sequence) query = query.eq('sequence', filters.sequence);

    const search = filters.search?.trim();
    if (search) query = query.ilike('title', `%${search}%`);

    return query.limit(filters.limit ?? 200);
  },

  async getCounts() {
    const [total, published, draft, hidden] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'rejected')
    ]);
    const firstError = total.error ?? published.error ?? draft.error ?? hidden.error;
    if (firstError) return { data: null, error: firstError };
    return {
      data: {
        total: total.count ?? 0,
        published: published.count ?? 0,
        draft: draft.count ?? 0,
        hidden: hidden.count ?? 0
      },
      error: null
    };
  },

  async getByIdAdmin(id: string) {
    return supabase.from('posts').select(selectFields).eq('id', id).single();
  },

  async create(input: ContentInput) {
    const { data: auth } = await supabase.auth.getUser();
    return supabase
      .from('posts')
      .insert({
        ...input,
        media: input.media ?? {},
        status: input.status ?? 'pending',
        is_official: input.is_official ?? false,
        author_id: auth.user?.id ?? null,
        updated_by: auth.user?.id ?? null
      })
      .select(selectFields)
      .single();
  },

  async update(id: string, patch: Partial<ContentInput>) {
    const { data: auth } = await supabase.auth.getUser();
    return supabase
      .from('posts')
      .update({ ...patch, updated_by: auth.user?.id ?? null })
      .eq('id', id)
      .select(selectFields)
      .single();
  },

  async setStatus(id: string, status: PostStatus, publishedAt?: string | null) {
    const patch: Partial<ContentInput> = { status };
    if (publishedAt !== undefined) patch.published_at = publishedAt;
    else if (status === 'approved') patch.published_at = new Date().toISOString();
    return adminContentRepository.update(id, patch);
  },

  async duplicate(id: string) {
    const { data: source, error } = await adminContentRepository.getByIdAdmin(id);
    if (error || !source) return { data: null, error: error ?? new Error('Content not found') };
    return adminContentRepository.create({
      post_type: source.post_type,
      title: `${source.title} (نسخة)`,
      title_en: source.title_en ? `${source.title_en} (copy)` : null,
      body: source.body,
      body_en: source.body_en,
      subject: source.subject,
      level: source.level,
      term: source.term,
      sequence: source.sequence,
      media: source.media,
      is_official: source.is_official,
      status: 'pending',
      published_at: null
    });
  },

  async remove(id: string) {
    return supabase.from('posts').delete().eq('id', id);
  }
};
