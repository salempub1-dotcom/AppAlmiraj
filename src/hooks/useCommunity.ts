import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  communityRepository,
  type CommunityFeedFilters,
  type CommunityPost,
  type CommunityPostInput
} from '../repositories/communityRepository';
import { communityMediaRepository, type PickedCommunityFile } from '../repositories/communityMediaRepository';

const FEED_PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Feed - paginated, newest-first. Authenticated-only by RLS; the screen is
// responsible for gating guests before ever calling this hook.
// ---------------------------------------------------------------------------
export function useCommunityFeed(filters: Omit<CommunityFeedFilters, 'before' | 'limit'> = {}) {
  const { type, subject, level, authorId, search } = filters;
  return useInfiniteQuery({
    queryKey: ['community', 'feed', type ?? 'all', subject ?? '', level ?? '', authorId ?? '', search ?? ''],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await communityRepository.feed({
        type,
        subject,
        level,
        authorId,
        search,
        before: pageParam,
        limit: FEED_PAGE_SIZE
      });
      if (error) throw error;
      return (data ?? []) as CommunityPost[];
    },
    getNextPageParam: (lastPage) => {
      const last = lastPage[lastPage.length - 1];
      return lastPage.length === FEED_PAGE_SIZE && last ? last.created_at : undefined;
    }
  });
}

export function useCommunityPostDetail(id: string) {
  return useQuery({
    queryKey: ['community', 'post', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await communityRepository.getById(id);
      if (error) throw error;
      return data as CommunityPost;
    }
  });
}

// ---------------------------------------------------------------------------
// Public teacher profiles - always backed by public.get_public_teacher_profiles(),
// never a direct `profiles` read. Used both for a feed's author lookups
// (batch, by the page's distinct author ids) and the profile screen (single id).
// ---------------------------------------------------------------------------
export function useTeacherPublicProfiles(profileIds: string[]) {
  const key = [...new Set(profileIds)].sort();
  return useQuery({
    queryKey: ['community', 'public-profiles', key],
    enabled: key.length > 0,
    queryFn: async () => {
      const { data, error } = await communityRepository.publicTeacherProfiles(key);
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useTeacherPublicProfile(profileId: string) {
  return useQuery({
    queryKey: ['community', 'public-profile', profileId],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await communityRepository.publicTeacherProfile(profileId);
      if (error) throw error;
      return data;
    }
  });
}

export function useTeacherPosts(authorId: string, limit = 20) {
  return useQuery({
    queryKey: ['community', 'teacher-posts', authorId, limit],
    enabled: Boolean(authorId),
    queryFn: async () => {
      const { data, error } = await communityRepository.feed({ authorId, limit });
      if (error) throw error;
      return (data ?? []) as CommunityPost[];
    }
  });
}

// ---------------------------------------------------------------------------
// Create post - safe upload flow:
//  1. validate (done by the caller/screen before invoking this mutation)
//  2. create the post row first (this gives us a real post id)
//  3. if there's an attachment, upload it to community-media/{uid}/{postId}/...
//  4. save the resulting media metadata on the post
//  5. if the upload or the metadata save fails, delete whatever was
//     uploaded AND roll back the post row, so no broken/orphaned post or
//     orphaned file is ever left behind.
// ---------------------------------------------------------------------------
export type CreateCommunityPostAttachment = { kind: 'image' | 'pdf'; file: PickedCommunityFile };

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      input,
      attachment
    }: {
      input: CommunityPostInput;
      attachment?: CreateCommunityPostAttachment;
    }) => {
      const { data: created, error: createError } = await communityRepository.create(input);
      if (createError || !created) throw createError ?? new Error('Could not create post');

      if (!attachment) return created as CommunityPost;

      let uploadedPath: string | null = null;
      try {
        const uploaded =
          attachment.kind === 'image'
            ? await communityMediaRepository.uploadImage(attachment.file, created.id)
            : await communityMediaRepository.uploadPdf(attachment.file, created.id);
        uploadedPath = uploaded.path;

        const { data: updated, error: updateError } = await communityRepository.update(created.id, {
          media: { type: attachment.kind, path: uploaded.path, url: uploaded.url, name: uploaded.name }
        });
        if (updateError || !updated) throw updateError ?? new Error('Could not save attachment');

        return updated as CommunityPost;
      } catch (err) {
        // Roll back: remove the uploaded file (if any) and the now-broken post row.
        if (uploadedPath) await communityMediaRepository.remove(uploadedPath).catch(() => {});
        await communityRepository.remove(created.id).catch(() => {});
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] });
    }
  });
}
