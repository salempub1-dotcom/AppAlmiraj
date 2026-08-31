import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  communityRepository,
  type CommunityComment,
  type CommunityPost,
  type CommunityReportReason,
  type PublicTeacherProfile
} from '../repositories/communityRepository';

// Phase D: likes, saves, comments, follows and reports for Teacher Space.
// Every hook here is written to be called ONCE per screen (not once per
// list row) - a single shared mutation object is reused across every card
// in a list, with the specific post/comment/teacher id passed as the
// mutation's variables. This keeps the number of live mutation/query
// objects independent of how many posts are on screen.
//
// Cache strategy for every like/save/follow mutation:
//  - onMutate: optimistic - flips the relevant boolean/id-set immediately
//    and applies a plain +/-1 delta to the visible counter, everywhere that
//    counter is cached (feed pages, teacher-profile-posts pages, saved-posts
//    pages, the single post-detail cache). This is what makes the tap feel
//    immediate (Phase D requirement 8).
//  - onError: undoes the exact same delta (cheap, and correct because the
//    operation is a pure +1/-1 - no cache snapshot/restore machinery needed).
//  - onSettled: re-fetches the authoritative row (post or profile) from
//    Supabase and overwrites the optimistic guess everywhere it's cached.
//    Database triggers remain the source of truth for every counter; the
//    optimistic delta is only ever a temporary visual stand-in for it
//    (Phase D requirement 7).

// ---------------------------------------------------------------------------
// Generic cache patchers - shared by likes/saves/comments/follow below.
// ---------------------------------------------------------------------------

// Applies `patch` to a CommunityPost wherever it's cached: the single
// post-detail query, and any post inside any loaded infinite-query page
// under the 'community' namespace - whether that page holds CommunityPost[]
// directly (feed, teacher-posts) or { post, savedAt }[] (saved-posts).
function patchCommunityPost(queryClient: QueryClient, postId: string, patch: (post: CommunityPost) => CommunityPost) {
  queryClient.setQueryData<CommunityPost | undefined>(['community', 'post', postId], (old) => (old ? patch(old) : old));

  queryClient.setQueriesData<{ pages: unknown[][] } | undefined>({ queryKey: ['community'] }, (old) => {
    if (!old || !Array.isArray(old.pages)) return old;
    let changed = false;
    const pages = old.pages.map((page) =>
      page.map((item) => {
        if (item && typeof item === 'object' && 'id' in item && (item as CommunityPost).id === postId) {
          changed = true;
          return patch(item as CommunityPost);
        }
        if (item && typeof item === 'object' && 'post' in item) {
          const wrapped = item as { post: CommunityPost };
          if (wrapped.post?.id === postId) {
            changed = true;
            return { ...wrapped, post: patch(wrapped.post) };
          }
        }
        return item;
      })
    );
    return changed ? { ...old, pages } : old;
  });
}

// Same idea for a PublicTeacherProfile: the single profile query and any
// batch-array query (['community','public-profiles', ids]) that contains it.
function patchTeacherProfile(
  queryClient: QueryClient,
  teacherId: string,
  patch: (profile: PublicTeacherProfile) => PublicTeacherProfile
) {
  queryClient.setQueryData<PublicTeacherProfile | null | undefined>(['community', 'public-profile', teacherId], (old) =>
    old ? patch(old) : old
  );
  queryClient.setQueriesData<PublicTeacherProfile[] | undefined>({ queryKey: ['community', 'public-profiles'] }, (old) => {
    if (!old) return old;
    let changed = false;
    const next = old.map((profile) => {
      if (profile.id !== teacherId) return profile;
      changed = true;
      return patch(profile);
    });
    return changed ? next : old;
  });
}

// Re-fetches the single authoritative row from Supabase (trigger-updated
// counters included) and overwrites every optimistic guess with it.
async function reconcilePost(queryClient: QueryClient, postId: string) {
  const { data } = await communityRepository.getById(postId);
  if (data) patchCommunityPost(queryClient, postId, () => data as CommunityPost);
}

async function reconcileTeacherProfile(queryClient: QueryClient, teacherId: string) {
  const { data } = await communityRepository.publicTeacherProfile(teacherId);
  if (data) patchTeacherProfile(queryClient, teacherId, () => data as PublicTeacherProfile);
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

// Batch-fetches which of the given post ids the current teacher has liked -
// ONE query for the whole visible set, never one per card. Mirrors
// useTeacherPublicProfiles' established batching pattern (Phase C): the key
// is the currently-loaded id set, so it grows (and re-queries once) as more
// feed pages load, but a single request still covers every already-loaded
// card at any point in time - never a per-card round trip.
export function useCommunityLikedIds(postIds: string[]) {
  const key = [...new Set(postIds)].sort();
  return useQuery({
    queryKey: ['community', 'liked-ids', key],
    enabled: key.length > 0,
    queryFn: async () => {
      const { data, error } = await communityRepository.myLikedPostIds(key);
      if (error) throw error;
      return new Set((data ?? []).map((row: { post_id: string }) => row.post_id));
    }
  });
}

export function useCommunitySavedIds(postIds: string[]) {
  const key = [...new Set(postIds)].sort();
  return useQuery({
    queryKey: ['community', 'saved-ids', key],
    enabled: key.length > 0,
    queryFn: async () => {
      const { data, error } = await communityRepository.mySavedPostIds(key);
      if (error) throw error;
      return new Set((data ?? []).map((row: { post_id: string }) => row.post_id));
    }
  });
}

// Single shared like/unlike mutation. Call once per screen; pass
// { postId, liked } (the post's *current* liked state, before the tap) to
// `.mutate()` from each card's onPress. The unique (post_id, user_id)
// constraint on community_likes makes a duplicate like impossible even if
// this ever double-fires; the UI additionally disables the button while a
// mutation for that specific postId is in flight (see CommunityPostCard).
export function useCommunityLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { error } = liked ? await communityRepository.unlike(postId) : await communityRepository.like(postId);
      if (error) throw error;
      return { postId, liked: !liked };
    },
    onMutate: async ({ postId, liked }) => {
      const nextLiked = !liked;
      queryClient.setQueriesData<Set<string> | undefined>({ queryKey: ['community', 'liked-ids'] }, (old) => {
        if (!old) return old;
        const next = new Set(old);
        if (nextLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      patchCommunityPost(queryClient, postId, (post) => ({
        ...post,
        likes_count: Math.max(0, post.likes_count + (nextLiked ? 1 : -1))
      }));
      return { postId, nextLiked };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueriesData<Set<string> | undefined>({ queryKey: ['community', 'liked-ids'] }, (old) => {
        if (!old) return old;
        const next = new Set(old);
        if (context.nextLiked) next.delete(context.postId);
        else next.add(context.postId);
        return next;
      });
      patchCommunityPost(queryClient, context.postId, (post) => ({
        ...post,
        likes_count: Math.max(0, post.likes_count + (context.nextLiked ? -1 : 1))
      }));
    },
    onSettled: (_data, _err, vars) => {
      reconcilePost(queryClient, vars.postId);
    }
  });
}

// ---------------------------------------------------------------------------
// Saves
// ---------------------------------------------------------------------------

export function useCommunitySave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, saved }: { postId: string; saved: boolean }) => {
      const { error } = saved ? await communityRepository.unsave(postId) : await communityRepository.save(postId);
      if (error) throw error;
      return { postId, saved: !saved };
    },
    onMutate: async ({ postId, saved }) => {
      const nextSaved = !saved;
      queryClient.setQueriesData<Set<string> | undefined>({ queryKey: ['community', 'saved-ids'] }, (old) => {
        if (!old) return old;
        const next = new Set(old);
        if (nextSaved) next.add(postId);
        else next.delete(postId);
        return next;
      });
      patchCommunityPost(queryClient, postId, (post) => ({
        ...post,
        saves_count: Math.max(0, post.saves_count + (nextSaved ? 1 : -1))
      }));
      return { postId, nextSaved };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueriesData<Set<string> | undefined>({ queryKey: ['community', 'saved-ids'] }, (old) => {
        if (!old) return old;
        const next = new Set(old);
        if (context.nextSaved) next.delete(context.postId);
        else next.add(context.postId);
        return next;
      });
      patchCommunityPost(queryClient, context.postId, (post) => ({
        ...post,
        saves_count: Math.max(0, post.saves_count + (context.nextSaved ? -1 : 1))
      }));
    },
    onSettled: (_data, _err, vars) => {
      reconcilePost(queryClient, vars.postId);
      // Saving/unsaving changes Saved Posts screen *membership*, not just a
      // counter - invalidate so it reflects the change (e.g. a post
      // unsaved from that screen actually disappears from it).
      queryClient.invalidateQueries({ queryKey: ['community', 'saved-posts'] });
    }
  });
}

const SAVED_POSTS_PAGE_SIZE = 12;

// Wrapped shape keeps the community_saves.created_at cursor (`savedAt`)
// alongside each post, since "newest-saved-first" pagination must cursor on
// when it was saved, not the post's own created_at.
type SavedCommunityPostRow = { post: CommunityPost; savedAt: string };

export function useSavedCommunityPosts() {
  return useInfiniteQuery({
    queryKey: ['community', 'saved-posts'],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<SavedCommunityPostRow[]> => {
      const { data, error } = await communityRepository.mySavedPosts(pageParam, SAVED_POSTS_PAGE_SIZE);
      if (error) throw error;
      type Row = { post_id: string; saved_at: string; community_posts: CommunityPost | null };
      return ((data ?? []) as unknown as Row[])
        .filter((row) => Boolean(row.community_posts))
        .map((row) => ({ post: row.community_posts as CommunityPost, savedAt: row.saved_at }));
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage[lastPage.length - 1];
      return lastPage.length === SAVED_POSTS_PAGE_SIZE && last ? last.savedAt : undefined;
    }
  });
}

// ---------------------------------------------------------------------------
// Comments - paginated, newest-first, flat (no nested replies in V1).
// ---------------------------------------------------------------------------

const COMMENTS_PAGE_SIZE = 20;

export function useCommunityComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['community', 'comments', postId],
    enabled: Boolean(postId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await communityRepository.comments(postId, pageParam, COMMENTS_PAGE_SIZE);
      if (error) throw error;
      return (data ?? []) as CommunityComment[];
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage[lastPage.length - 1];
      return lastPage.length === COMMENTS_PAGE_SIZE && last ? last.created_at : undefined;
    }
  });
}

// No optimistic insert here on purpose (Phase D explicitly avoids fragile
// optimistic comment counters): the new comment is only added to the cache
// once Supabase confirms it, with its real id/timestamp, then the post row
// is re-fetched so comments_count reflects the trigger-updated value.
export function useAddCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data, error } = await communityRepository.addComment(postId, body);
      if (error || !data) throw error ?? new Error('Could not add comment');
      return data as CommunityComment;
    },
    onSuccess: async (comment) => {
      queryClient.setQueryData<{ pages: CommunityComment[][]; pageParams: unknown[] } | undefined>(
        ['community', 'comments', postId],
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          pages[0] = [comment, ...(pages[0] ?? [])];
          return { ...old, pages };
        }
      );
      await reconcilePost(queryClient, postId);
    }
  });
}

// RLS (community_comments_own_delete) already guarantees a teacher can only
// delete their own comment - this mutation has no special-cased "is it
// mine" check because the server rejects it outright otherwise.
export function useDeleteCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await communityRepository.removeComment(commentId);
      if (error) throw error;
      return commentId;
    },
    onSuccess: async (commentId) => {
      queryClient.setQueryData<{ pages: CommunityComment[][]; pageParams: unknown[] } | undefined>(
        ['community', 'comments', postId],
        (old) => (old ? { ...old, pages: old.pages.map((page) => page.filter((c) => c.id !== commentId)) } : old)
      );
      await reconcilePost(queryClient, postId);
    }
  });
}

// ---------------------------------------------------------------------------
// Follow / unfollow
// ---------------------------------------------------------------------------

export function useIsFollowing(teacherId: string) {
  return useQuery({
    queryKey: ['community', 'is-following', teacherId],
    enabled: Boolean(teacherId),
    queryFn: async () => {
      const { data, error } = await communityRepository.amIFollowing(teacherId);
      if (error) throw error;
      return data as boolean;
    }
  });
}

export function useFollowTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teacherId, following }: { teacherId: string; following: boolean }) => {
      const { error } = following ? await communityRepository.unfollow(teacherId) : await communityRepository.follow(teacherId);
      if (error) throw error;
      return { teacherId, following: !following };
    },
    onMutate: async ({ teacherId, following }) => {
      const nextFollowing = !following;
      queryClient.setQueryData<boolean | undefined>(['community', 'is-following', teacherId], () => nextFollowing);
      patchTeacherProfile(queryClient, teacherId, (profile) => ({
        ...profile,
        followers_count: Math.max(0, profile.followers_count + (nextFollowing ? 1 : -1))
      }));
      return { teacherId, nextFollowing, prevFollowing: following };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(['community', 'is-following', context.teacherId], context.prevFollowing);
      patchTeacherProfile(queryClient, context.teacherId, (profile) => ({
        ...profile,
        followers_count: Math.max(0, profile.followers_count + (context.prevFollowing ? 1 : -1))
      }));
    },
    onSettled: (_data, _err, vars) => {
      reconcileTeacherProfile(queryClient, vars.teacherId);
    }
  });
}

// ---------------------------------------------------------------------------
// Reports - user-side only in Phase D (no admin moderation screen yet).
// ---------------------------------------------------------------------------

export function useReportCommunityContent() {
  return useMutation({
    mutationFn: async (input: { targetType: 'post' | 'comment'; targetId: string; reason: CommunityReportReason; details?: string }) => {
      const { error } = await communityRepository.report(input);
      if (error) throw error;
      return true;
    }
  });
}
