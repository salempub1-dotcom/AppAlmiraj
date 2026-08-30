import { supabase } from '../services/supabase';

export type PostType = 'video' | 'article' | 'teacher_tip' | 'question' | 'poll' | 'exam' | 'test' | 'resource' | 'announcement';

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

export const contentRepository = {
  async getLatest(limit = 8) {
    return supabase
      .from('posts')
      .select('id,post_type,title,body,subject,level,term,sequence,media,is_official,helpful_count,published_at,created_at')
      .eq('status', 'approved')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
  },

  async getByType(postType: PostType, limit = 30) {
    return supabase
      .from('posts')
      .select('id,post_type,title,body,subject,level,term,sequence,media,is_official,helpful_count,published_at,created_at')
      .eq('status', 'approved')
      .eq('post_type', postType)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
  }
};
