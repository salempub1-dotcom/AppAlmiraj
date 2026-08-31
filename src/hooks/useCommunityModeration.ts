import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  communityModerationRepository,
  communityRepository,
  type CommunityComment,
  type CommunityPost,
  type CommunityReport,
  type CommunityReportListFilters,
  type PublicTeacherProfile
} from '../repositories/communityRepository';

// Phase E: admin-only Community Moderation. This is a completely separate
// surface from Phase D's user-side reporting (useReportCommunityContent) -
// those write a report; these read/resolve them. UI visibility is gated by
// useIsAdmin() in the screen; the real security boundary is still RLS
// (community_reports/_posts/_comments admin policies, all backed by
// public.is_admin()) - these hooks perform no permission check of their own.

const MODERATION_KEY = ['community', 'moderation'] as const;

// ---------------------------------------------------------------------------
// Reports list - paginated implicitly by the repository's `limit` (a flat
// cap, not cursor pagination: an admin moderation queue is expected to stay
// small relative to the feed, and V1 keeps this simple per the Phase E
// spec's "keep the UI simple" instruction).
// ---------------------------------------------------------------------------
export function useCommunityReports(filters: CommunityReportListFilters) {
  return useQuery({
    queryKey: [...MODERATION_KEY, 'reports', filters.status ?? 'all', filters.targetType ?? 'all'],
    queryFn: async () => {
      const { data, error } = await communityModerationRepository.listReports(filters);
      if (error) throw error;
      return (data ?? []) as CommunityReport[];
    }
  });
}

// Batches everything a moderation row needs to render beyond the report
// itself: the reported post/comment (one request per target type for the
// whole currently-loaded report set, never one per row) and the reporting
// teacher's public profile (reused from the existing batched
// get_public_teacher_profiles RPC - the same "no direct `profiles` read"
// guarantee applies here). A profile simply won't be in the map when it
// isn't safely available (e.g. a non-public community profile) - the screen
// falls back to a generic label rather than ever guessing at hidden data.
export function useModerationTargets(reports: CommunityReport[]) {
  const postIds = useMemo(
    () => [...new Set(reports.filter((r) => r.target_type === 'post').map((r) => r.target_id))].sort(),
    [reports]
  );
  const commentIds = useMemo(
    () => [...new Set(reports.filter((r) => r.target_type === 'comment').map((r) => r.target_id))].sort(),
    [reports]
  );
  const reporterIds = useMemo(() => [...new Set(reports.map((r) => r.reporter_id))].sort(), [reports]);

  const posts = useQuery({
    queryKey: [...MODERATION_KEY, 'targets', 'posts', postIds],
    enabled: postIds.length > 0,
    queryFn: async () => {
      const { data, error } = await communityModerationRepository.postsByIds(postIds);
      if (error) throw error;
      return (data ?? []) as CommunityPost[];
    }
  });

  const comments = useQuery({
    queryKey: [...MODERATION_KEY, 'targets', 'comments', commentIds],
    enabled: commentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await communityModerationRepository.commentsByIds(commentIds);
      if (error) throw error;
      return (data ?? []) as CommunityComment[];
    }
  });

  const reporters = useQuery({
    queryKey: ['community', 'public-profiles', reporterIds],
    enabled: reporterIds.length > 0,
    queryFn: async () => {
      const { data, error } = await communityRepository.publicTeacherProfiles(reporterIds);
      if (error) throw error;
      return (data ?? []) as PublicTeacherProfile[];
    }
  });

  const postById = useMemo(() => new Map((posts.data ?? []).map((p) => [p.id, p])), [posts.data]);
  const commentById = useMemo(() => new Map((comments.data ?? []).map((c) => [c.id, c])), [comments.data]);
  const reporterById = useMemo(() => new Map((reporters.data ?? []).map((p) => [p.id, p])), [reporters.data]);

  return {
    postById,
    commentById,
    reporterById,
    isLoading: posts.isLoading || comments.isLoading || reporters.isLoading
  };
}

// ---------------------------------------------------------------------------
// Moderation actions. Each one both settles the report AND (for hide/remove)
// applies the content status change - a moderator resolving a report and
// the resulting content action are one deliberate step, not two. All four
// simply invalidate the moderation queries afterward (a light admin screen,
// not the high-frequency feed path Phase D optimized - a full refetch here
// is the right trade-off over hand-rolled optimistic-cache patching).
// ---------------------------------------------------------------------------
function useModerationInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY });
}

export function useHideReportedContent() {
  const invalidate = useModerationInvalidate();
  return useMutation({
    mutationFn: async (report: CommunityReport) => {
      if (report.target_type === 'post') {
        const { error } = await communityModerationRepository.setPostStatus(report.target_id, 'hidden');
        if (error) throw error;
      } else if (report.target_type === 'comment') {
        const { error } = await communityModerationRepository.setCommentStatus(report.target_id, 'hidden');
        if (error) throw error;
      }
      const { error } = await communityModerationRepository.resolveReport(report.id, 'actioned');
      if (error) throw error;
    },
    onSuccess: invalidate
  });
}

export function useRemoveReportedContent() {
  const invalidate = useModerationInvalidate();
  return useMutation({
    mutationFn: async (report: CommunityReport) => {
      if (report.target_type === 'post') {
        const { error } = await communityModerationRepository.setPostStatus(report.target_id, 'removed');
        if (error) throw error;
      } else if (report.target_type === 'comment') {
        const { error } = await communityModerationRepository.setCommentStatus(report.target_id, 'removed');
        if (error) throw error;
      }
      const { error } = await communityModerationRepository.resolveReport(report.id, 'actioned');
      if (error) throw error;
    },
    onSuccess: invalidate
  });
}

export function useDismissReport() {
  const invalidate = useModerationInvalidate();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await communityModerationRepository.resolveReport(reportId, 'dismissed');
      if (error) throw error;
    },
    onSuccess: invalidate
  });
}

export function useResolveReport() {
  const invalidate = useModerationInvalidate();
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await communityModerationRepository.resolveReport(reportId, 'reviewed');
      if (error) throw error;
    },
    onSuccess: invalidate
  });
}
