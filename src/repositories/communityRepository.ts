import { supabase } from '../services/supabase';

// Teacher Space ("فضاء الأستاذ") data layer.
//
// This is a completely separate domain from `contentRepository.ts` (the
// official Content Manager / `posts` table). Nothing here reads or writes
// `posts`, `products`, `orders` or any store/checkout table.
//
// No video support in V1: `CommunityPostType` intentionally has no `video`
// member and `CommunityMedia['type']` only allows 'image' | 'pdf'.

export type CommunityPostType =
  | 'text'
  | 'image'
  | 'pdf'
  | 'question'
  | 'idea'
  | 'exam'
  | 'test'
  | 'resource'
  | 'classroom_experience'
  | 'tip';

export const COMMUNITY_POST_TYPES: CommunityPostType[] = [
  'text',
  'image',
  'pdf',
  'question',
  'idea',
  'exam',
  'test',
  'resource',
  'classroom_experience',
  'tip'
];

export type CommunityPostStatus = 'visible' | 'hidden' | 'removed';
export const COMMUNITY_POST_STATUSES: CommunityPostStatus[] = ['visible', 'hidden', 'removed'];

export type CommunityCommentStatus = 'visible' | 'hidden' | 'removed';

export type CommunityMedia = {
  type?: 'image' | 'pdf';
  path?: string;
  url?: string;
  name?: string;
};

export type CommunityPost = {
  id: string;
  author_id: string;
  type: CommunityPostType;
  title: string | null;
  body: string | null;
  subject: string | null;
  level: string[];
  media: CommunityMedia;
  status: CommunityPostStatus;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityPostInput = {
  type: CommunityPostType;
  title?: string | null;
  body?: string | null;
  subject?: string | null;
  level?: string[];
  media?: CommunityMedia;
};

export type CommunityFeedFilters = {
  type?: CommunityPostType;
  subject?: string;
  level?: string;
  authorId?: string;
  search?: string;
  limit?: number;
  before?: string; // created_at cursor for pagination
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: CommunityCommentStatus;
  created_at: string;
  updated_at: string;
};

// V1 report reasons - stable slugs (not localized text) so the reason is
// filterable/consistent regardless of the reporting teacher's UI language.
// Bilingual labels live in communityCopy.ts (report.reasons).
export type CommunityReportReason =
  | 'not_educational'
  | 'inappropriate'
  | 'harassment'
  | 'copyright'
  | 'misleading'
  | 'other';

export const COMMUNITY_REPORT_REASONS: CommunityReportReason[] = [
  'not_educational',
  'inappropriate',
  'harassment',
  'copyright',
  'misleading',
  'other'
];

export type CommunityReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned';
export type CommunityReportTargetType = 'post' | 'comment' | 'profile';

export type CommunityReport = {
  id: string;
  target_type: CommunityReportTargetType;
  target_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: CommunityReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

// Own community_profiles row (bio / visibility toggle / cached counters).
export type CommunityProfile = {
  id: string;
  bio: string | null;
  is_public: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
};

// Result of public.get_public_teacher_profiles(). Deliberately narrow -
// never carries phone, notif_prefs, role or email.
export type PublicTeacherProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subject: string | null;
  level: string[] | null;
  wilaya: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
};

const postFields =
  'id,author_id,type,title,body,subject,level,media,status,likes_count,comments_count,saves_count,is_pinned,created_at,updated_at';

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const communityRepository = {
  // ---- Feed / posts ---------------------------------------------------------
  async feed(filters: CommunityFeedFilters = {}) {
    let query = supabase
      .from('community_posts')
      .select(postFields)
      .eq('status', 'visible')
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.subject) query = query.eq('subject', filters.subject);
    if (filters.level) query = query.contains('level', [filters.level]);
    if (filters.authorId) query = query.eq('author_id', filters.authorId);
    if (filters.before) query = query.lt('created_at', filters.before);

    const search = filters.search?.trim();
    if (search) query = query.ilike('title', `%${search}%`);

    return query.limit(filters.limit ?? 20);
  },

  async getById(id: string) {
    return supabase.from('community_posts').select(postFields).eq('id', id).single();
  },

  async myPosts(limit = 50) {
    const userId = await currentUserId();
    if (!userId) return { data: [], error: null };
    return supabase
      .from('community_posts')
      .select(postFields)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  // Paginated posts for a teacher's public profile page. Mirrors feed()'s
  // cursor pagination, but scoped to one author. Unlike feed() (always
  // status = 'visible'), a teacher viewing their OWN profile sees their own
  // rows exactly as RLS allows (including their own hidden/removed posts) -
  // viewing someone else's profile only ever shows that teacher's visible
  // posts, matching the Phase D requirement that no hidden/removed post from
  // another teacher is ever shown.
  async teacherPosts(authorId: string, before?: string, limit = 12) {
    const viewerId = await currentUserId();
    let query = supabase
      .from('community_posts')
      .select(postFields)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (viewerId !== authorId) query = query.eq('status', 'visible');
    if (before) query = query.lt('created_at', before);
    return query;
  },

  async create(input: CommunityPostInput) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase
      .from('community_posts')
      .insert({
        author_id: userId,
        type: input.type,
        title: input.title ?? null,
        body: input.body ?? null,
        subject: input.subject ?? null,
        level: input.level ?? [],
        media: input.media ?? {}
      })
      .select(postFields)
      .single();
  },

  async update(id: string, patch: Partial<CommunityPostInput>) {
    return supabase.from('community_posts').update(patch).eq('id', id).select(postFields).single();
  },

  // Soft-hide by the author (does not delete). Admin moderation actions
  // reuse the same 'hidden'/'removed' values via the admin-gated RLS policy.
  async setStatus(id: string, status: CommunityPostStatus) {
    return supabase.from('community_posts').update({ status }).eq('id', id).select(postFields).single();
  },

  async remove(id: string) {
    return supabase.from('community_posts').delete().eq('id', id);
  },

  // ---- Likes ------------------------------------------------------------------
  async like(postId: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase.from('community_likes').insert({ post_id: postId, user_id: userId });
  },

  async unlike(postId: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId);
  },

  async myLikedPostIds(postIds: string[]) {
    const userId = await currentUserId();
    if (!userId || postIds.length === 0) return { data: [], error: null };
    return supabase.from('community_likes').select('post_id').eq('user_id', userId).in('post_id', postIds);
  },

  // ---- Saves ------------------------------------------------------------------
  async save(postId: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase.from('community_saves').insert({ post_id: postId, user_id: userId });
  },

  async unsave(postId: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase.from('community_saves').delete().eq('post_id', postId).eq('user_id', userId);
  },

  async mySavedPostIds(postIds: string[]) {
    const userId = await currentUserId();
    if (!userId || postIds.length === 0) return { data: [], error: null };
    return supabase.from('community_saves').select('post_id').eq('user_id', userId).in('post_id', postIds);
  },

  // Paginated, newest-saved-first. `community_saves.created_at` (aliased
  // saved_at, since the RLS "read own saves only" policy means this can
  // never leak another user's saves) drives the cursor - NOT the post's own
  // created_at - so "newest saved" ordering is correct even for an old post
  // a teacher saves today. RLS also still applies to the embedded
  // community_posts row, so a since-removed/hidden post a teacher once
  // saved simply won't come back through the !inner join.
  async mySavedPosts(before?: string, limit = 12) {
    const userId = await currentUserId();
    if (!userId) return { data: [], error: null };
    let query = supabase
      .from('community_saves')
      .select(`post_id, saved_at:created_at, community_posts!inner(${postFields})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (before) query = query.lt('created_at', before);
    return query;
  },

  // ---- Comments -----------------------------------------------------------------
  // Paginated, newest-first (mirrors feed()'s cursor pattern). RLS already
  // restricts rows to status = 'visible' OR author_id = auth.uid(); the
  // client-side status filter further narrows a teacher's own view to only
  // their own visible comments, consistent with the original Phase B design.
  async comments(postId: string, before?: string, limit = 20) {
    let query = supabase
      .from('community_comments')
      .select('id,post_id,author_id,body,status,created_at,updated_at')
      .eq('post_id', postId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (before) query = query.lt('created_at', before);
    return query;
  },

  async addComment(postId: string, body: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase
      .from('community_comments')
      .insert({ post_id: postId, author_id: userId, body })
      .select('id,post_id,author_id,body,status,created_at,updated_at')
      .single();
  },

  async removeComment(id: string) {
    return supabase.from('community_comments').delete().eq('id', id);
  },

  // ---- Follows ------------------------------------------------------------------
  async follow(teacherId: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    // Defense in depth: the UI never renders a Follow button on a teacher's
    // own profile, and community_follows has a `check (follower_id <>
    // following_id)` constraint server-side either way - this just avoids a
    // pointless round trip if it's ever somehow triggered.
    if (userId === teacherId) throw new Error('لا يمكن متابعة نفسك.');
    return supabase.from('community_follows').insert({ follower_id: userId, following_id: teacherId });
  },

  async unfollow(teacherId: string) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase.from('community_follows').delete().eq('follower_id', userId).eq('following_id', teacherId);
  },

  async amIFollowing(teacherId: string) {
    const userId = await currentUserId();
    if (!userId) return { data: false, error: null };
    const { data, error } = await supabase
      .from('community_follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', teacherId)
      .maybeSingle();
    return { data: Boolean(data), error };
  },

  // ---- My own community profile (bio / visibility toggle) --------------------------
  async getMyCommunityProfile() {
    const userId = await currentUserId();
    if (!userId) return { data: null, error: null };
    return supabase.from('community_profiles').select('*').eq('id', userId).maybeSingle();
  },

  async upsertMyCommunityProfile(patch: { bio?: string | null; is_public?: boolean }) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase
      .from('community_profiles')
      .upsert({ id: userId, ...patch }, { onConflict: 'id' })
      .select('*')
      .single();
  },

  // ---- Public teacher profiles (safe, narrow columns only) --------------------------
  // Backed by public.get_public_teacher_profiles(uuid[]) - never selects
  // from `profiles` directly, so phone/notif_prefs/role/email can never
  // leak through this repository.
  async publicTeacherProfiles(profileIds: string[]) {
    if (profileIds.length === 0) return { data: [] as PublicTeacherProfile[], error: null };
    return supabase.rpc('get_public_teacher_profiles', { profile_ids: profileIds });
  },

  async publicTeacherProfile(profileId: string) {
    const { data, error } = await communityRepository.publicTeacherProfiles([profileId]);
    if (error) return { data: null, error };
    return { data: (data as PublicTeacherProfile[] | null)?.[0] ?? null, error: null };
  },

  // ---- Reports ---------------------------------------------------------------------
  async report(input: { targetType: 'post' | 'comment' | 'profile'; targetId: string; reason: string; details?: string }) {
    const userId = await currentUserId();
    if (!userId) throw new Error('يجب تسجيل الدخول');
    return supabase.from('community_reports').insert({
      target_type: input.targetType,
      target_id: input.targetId,
      reporter_id: userId,
      reason: input.reason,
      details: input.details ?? null
    });
  }
};

// ---------------------------------------------------------------------------
// Admin moderation reads/writes. Deliberately kept in this same file (not
// merged into adminContentRepository.ts) - Community Moderation and the
// official Content Manager are separate concepts operating on separate
// tables, per the product spec.
// ---------------------------------------------------------------------------
export type CommunityReportListFilters = {
  // 'resolved' collapses the three closed statuses (reviewed/dismissed/
  // actioned) into one tab - the Moderation screen's "Open" / "Resolved"
  // split from the Phase E spec - while still keeping each report's own
  // precise status (shown on its row) intact.
  status?: 'open' | 'resolved';
  targetType?: CommunityReportTargetType;
};

export const communityModerationRepository = {
  async listReports(filters: CommunityReportListFilters = {}, limit = 100) {
    let query = supabase.from('community_reports').select('*').order('created_at', { ascending: false }).limit(limit);
    if (filters.status === 'open') query = query.eq('status', 'open');
    else if (filters.status === 'resolved') query = query.in('status', ['reviewed', 'dismissed', 'actioned']);
    if (filters.targetType) query = query.eq('target_type', filters.targetType);
    return query;
  },

  async resolveReport(id: string, status: 'reviewed' | 'dismissed' | 'actioned') {
    const userId = await currentUserId();
    return supabase
      .from('community_reports')
      .update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
  },

  async setPostStatus(id: string, status: CommunityPostStatus) {
    return supabase.from('community_posts').update({ status }).eq('id', id).select(postFields).single();
  },

  async setCommentStatus(id: string, status: CommunityCommentStatus) {
    return supabase
      .from('community_comments')
      .update({ status })
      .eq('id', id)
      .select('id,post_id,author_id,body,status,created_at,updated_at')
      .single();
  },

  // Batched target-content previews for the moderation list - ONE request
  // for every distinct reported post id currently on screen, and one for
  // every distinct reported comment id, never one per report row. Admin
  // read access (including already-hidden/removed rows, which is exactly
  // what a moderator needs to see) comes from the existing
  // community_posts_admin_read_all / community_comments_admin_read_all RLS
  // policies - this performs no privilege check of its own.
  async postsByIds(ids: string[]) {
    if (ids.length === 0) return { data: [] as CommunityPost[], error: null };
    return supabase.from('community_posts').select(postFields).in('id', ids);
  },

  async commentsByIds(ids: string[]) {
    if (ids.length === 0) return { data: [] as CommunityComment[], error: null };
    return supabase
      .from('community_comments')
      .select('id,post_id,author_id,body,status,created_at,updated_at')
      .in('id', ids);
  }
};
