import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityMediaRepository } from '../repositories/communityMediaRepository';
import {
  communityRepository,
  type CommunityMedia,
  type CommunityPost,
  type CommunityPostInput
} from '../repositories/communityRepository';
import type { CreateCommunityPostAttachment } from './useCommunity';

// Post-owner management: edit, hide/show, delete. RLS
// (community_posts_own_update / community_posts_own_delete, both scoped to
// `author_id = auth.uid()`) is the real security boundary - a teacher can
// only ever affect their own post through these hooks regardless of what
// the UI shows; the screen only decides whether to render the owner menu.
//
// Every mutation invalidates the same set of caches a post can appear in
// (feed, teacher-profile-posts, saved-posts, the single post-detail query)
// so a change is reflected everywhere it's visible, not just on the screen
// that triggered it - the same invalidation set useCreateCommunityPost and
// useCommunityInteractions already use for this table.
function invalidatePostLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['community', 'feed'] });
  queryClient.invalidateQueries({ queryKey: ['community', 'teacher-posts'] });
  queryClient.invalidateQueries({ queryKey: ['community', 'saved-posts'] });
}

export type CommunityPostAttachmentAction =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'replace'; attachment: CreateCommunityPostAttachment };

export type UpdateCommunityPostInput = Omit<CommunityPostInput, 'media'>;

// Safe attachment replacement (Phase F requirement 3): the new file is
// uploaded FIRST; the post row is only updated once that upload succeeds;
// the OLD storage object is only removed after that DB update succeeds. If
// the upload fails, the post is never touched. If the DB update fails after
// a successful upload, the just-uploaded file is deleted so nothing is left
// orphaned, and the old attachment is left exactly as it was.
export function useUpdateCommunityPost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      attachmentAction,
      previousMedia
    }: {
      input: UpdateCommunityPostInput;
      attachmentAction: CommunityPostAttachmentAction;
      previousMedia: CommunityMedia;
    }) => {
      if (attachmentAction.kind === 'keep') {
        const { data, error } = await communityRepository.update(postId, input);
        if (error || !data) throw error ?? new Error('Could not update post');
        return data as CommunityPost;
      }

      if (attachmentAction.kind === 'remove') {
        const { data, error } = await communityRepository.update(postId, { ...input, media: {} });
        if (error || !data) throw error ?? new Error('Could not update post');
        if (previousMedia.path) await communityMediaRepository.remove(previousMedia.path).catch(() => {});
        return data as CommunityPost;
      }

      // replace
      const { attachment } = attachmentAction;
      const uploaded =
        attachment.kind === 'image'
          ? await communityMediaRepository.uploadImage(attachment.file, postId)
          : await communityMediaRepository.uploadPdf(attachment.file, postId);

      const { data, error } = await communityRepository.update(postId, {
        ...input,
        media: { type: attachment.kind, path: uploaded.path, url: uploaded.url, name: uploaded.name }
      });
      if (error || !data) {
        // Upload succeeded but the DB update didn't - clean up the orphan
        // upload; the post/old attachment stay exactly as they were.
        await communityMediaRepository.remove(uploaded.path).catch(() => {});
        throw error ?? new Error('Could not update post');
      }

      // DB update confirmed - now it's safe to drop the old file.
      if (previousMedia.path) await communityMediaRepository.remove(previousMedia.path).catch(() => {});
      return data as CommunityPost;
    },
    onSuccess: (post) => {
      queryClient.setQueryData(['community', 'post', post.id], post);
      invalidatePostLists(queryClient);
    }
  });
}

// Hide / show only ever writes 'visible' or 'hidden' - never 'removed',
// which stays exclusive to admin moderation (useHideReportedContent /
// useRemoveReportedContent in useCommunityModeration.ts).
export function useSetOwnCommunityPostVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: 'visible' | 'hidden' }) => {
      const { data, error } = await communityRepository.setStatus(postId, status);
      if (error || !data) throw error ?? new Error('Could not update post status');
      return data as CommunityPost;
    },
    onSuccess: (post) => {
      queryClient.setQueryData(['community', 'post', post.id], post);
      invalidatePostLists(queryClient);
    }
  });
}

// Deleting the post row cascades to community_likes / community_saves /
// community_comments at the database level (all three declare `post_id
// references public.community_posts(id) on delete cascade` - see
// 0005_community.sql) - nothing extra is needed here for those. The one
// thing with no DB-level cascade is the post's own storage attachment (a
// community-media object has no FK relationship to the post row at all),
// which this removes explicitly after the row delete succeeds.
export function useDeleteCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, media }: { postId: string; media: CommunityMedia }) => {
      const { error } = await communityRepository.remove(postId);
      if (error) throw error;
      if (media.path) await communityMediaRepository.remove(media.path).catch(() => {});
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.removeQueries({ queryKey: ['community', 'post', postId] });
      invalidatePostLists(queryClient);
    }
  });
}
