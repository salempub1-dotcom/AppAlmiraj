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

export type ContentPost = {
  id: string;
  post_type: PostType;
  title: string;
  body: string | null;
  subject: string | null;
  level: string | null;
  term: string | null;
  sequence: string | null;
  media: Record<string, unknown>;
  is_official: boolean;
  helpful_count: number;
  published_at: string | null;
  created_at: string;
};

export type ContentFilters = {
  postType?: PostType;
  search?: string;
  subject?: string;
  level?: string;
  term?: string;
  limit?: number;
};

const selectFields =
  'id,post_type,title,body,subject,level,term,sequence,media,is_official,helpful_count,published_at,created_at';

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
