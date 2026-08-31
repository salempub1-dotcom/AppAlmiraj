import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityPostDetail, useTeacherPublicProfile, useTeacherPublicProfiles } from '../../../hooks/useCommunity';
import {
  useAddCommunityComment,
  useCommunityComments,
  useCommunityLike,
  useCommunityLikedIds,
  useCommunitySave,
  useCommunitySavedIds,
  useDeleteCommunityComment
} from '../../../hooks/useCommunityInteractions';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { CommentRow } from '../components/CommentRow';
import { ReportModal } from '../components/ReportModal';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { communityTypeIcons } from '../contentTypeIcons';

// Gated the same way as the feed: every data hook below only runs once a
// session is confirmed (see TeacherSpaceGate). There is no in-app path
// that reaches this screen as a guest today, but this keeps the guarantee
// true even if a future deep link adds one.
export function CommunityPostDetailScreen({ route, navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CommunityPostDetailContent route={route} navigation={navigation} />
    </TeacherSpaceGate>
  );
}

type ReportTarget = { targetType: 'post' | 'comment'; targetId: string } | null;

function CommunityPostDetailContent({ route, navigation }: any) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const postId = String(route.params?.postId ?? '');

  const detail = useCommunityPostDetail(postId);
  const author = useTeacherPublicProfile(detail.data?.author_id ?? '');

  // Like/save - single-post batched lookup (same hooks/pattern as the
  // feed, just called with a 1-element id array here).
  const likedIds = useCommunityLikedIds([postId]);
  const savedIds = useCommunitySavedIds([postId]);
  const likeMutation = useCommunityLike();
  const saveMutation = useCommunitySave();
  const liked = likedIds.data?.has(postId) ?? false;
  const saved = savedIds.data?.has(postId) ?? false;

  // Comments - paginated, newest-first, flat. Comment authors are batch-
  // loaded exactly like the feed batches post authors - one request for the
  // whole currently-loaded comment set, never one per comment.
  const comments = useCommunityComments(postId);
  const commentRows = useMemo(() => comments.data?.pages.flat() ?? [], [comments.data]);
  const commentAuthorIds = useMemo(() => [...new Set(commentRows.map((c) => c.author_id))], [commentRows]);
  const commentAuthors = useTeacherPublicProfiles(commentAuthorIds);
  const commentAuthorById = useMemo(() => {
    const map = new Map<string, PublicTeacherProfile>();
    (commentAuthors.data ?? []).forEach((profile: PublicTeacherProfile) => map.set(profile.id, profile));
    return map;
  }, [commentAuthors.data]);
  const addComment = useAddCommunityComment(postId);
  const deleteComment = useDeleteCommunityComment(postId);
  const [commentBody, setCommentBody] = useState('');

  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);

  if (detail.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>{copy.detail.loading}</Text>
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="alert-circle-outline" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{copy.detail.loadError}</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>{copy.detail.loadErrorText}</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Ionicons name="refresh-outline" size={18} color="#0B1833" />
          <Text style={styles.buttonText}>{copy.detail.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  const post = detail.data;
  const meta = [post.subject, ...(post.level ?? [])].filter(Boolean).join('  •  ');
  const isOwnPost = Boolean(viewerId) && post.author_id === viewerId;

  const handleSubmitComment = () => {
    const body = commentBody.trim();
    if (!body || addComment.isPending) return;
    addComment.mutate(body, {
      onSuccess: () => setCommentBody(''),
      onError: () => Alert.alert(copy.comments.postError)
    });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(commentId, {
      onError: () => Alert.alert(copy.comments.deleteError)
    });
  };

  return (
    <>
      <Screen scroll style={styles.page}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroTopRow, { flexDirection: row }]}>
            <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}18`, flexDirection: row }]}>
              <Ionicons name={communityTypeIcons[post.type]} size={16} color={colors.primary} />
              <Text style={[styles.typeText, { color: colors.primary }]}>{copy.types[post.type]}</Text>
            </View>
            {!isOwnPost && (
              <Pressable
                onPress={() => setReportTarget({ targetType: 'post', targetId: post.id })}
                hitSlop={10}
                accessibilityLabel={copy.detail.moreOptions}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {!!post.title && (
            <Text style={[styles.title, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{post.title}</Text>
          )}
          {!!meta && <Text style={[styles.meta, { color: colors.muted, textAlign: align }]}>{meta}</Text>}
          <Text style={[styles.time, { color: colors.muted, textAlign: align }]}>{formatRelativeTime(post.created_at, language)}</Text>
        </View>

        {!!post.body && (
          <View style={[styles.bodyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.body, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{post.body}</Text>
          </View>
        )}

        {post.media?.type === 'image' && !!post.media.url && (
          <View style={[styles.attachmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.attachmentLabel, { color: colors.muted, textAlign: align }]}>{copy.detail.attachment}</Text>
            <Image source={{ uri: post.media.url }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {post.media?.type === 'pdf' && !!post.media.url && (
          <Pressable
            onPress={() => Linking.openURL(post.media.url!)}
            style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, flexDirection: row }]}
          >
            <Ionicons name="document-attach-outline" size={19} color="#0B1833" />
            <Text style={styles.buttonText}>{copy.detail.openPdf}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => navigation.navigate('TeacherCommunityProfile', { teacherId: post.author_id })}
          style={({ pressed }) => [styles.authorCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row, opacity: pressed ? 0.94 : 1 }]}
        >
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}>
            {author.data?.avatar_url ? (
              <Image source={{ uri: author.data.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={22} color={colors.primary} />
            )}
          </View>
          <View style={styles.authorCopy}>
            <Text style={[styles.authorLabel, { color: colors.muted, textAlign: align }]}>{copy.detail.about}</Text>
            <Text style={[styles.authorName, { color: colors.text, textAlign: align }]}>{author.data?.full_name ?? '…'}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
        </Pressable>

        <View style={[styles.interactionsRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          <InteractionButton
            icon={liked ? 'heart' : 'heart-outline'}
            value={post.likes_count}
            label={liked ? copy.interactions.liked : copy.interactions.like}
            color={liked ? colors.danger : colors.muted}
            onPress={() => likeMutation.mutate({ postId, liked })}
            disabled={likeMutation.isPending && likeMutation.variables?.postId === postId}
          />
          <InteractionButton icon="chatbubble-outline" value={post.comments_count} label={copy.interactions.comment} color={colors.muted} />
          <InteractionButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            value={post.saves_count}
            label={saved ? copy.interactions.saved : copy.interactions.save}
            color={saved ? colors.primary : colors.muted}
            onPress={() => saveMutation.mutate({ postId, saved })}
            disabled={saveMutation.isPending && saveMutation.variables?.postId === postId}
          />
        </View>

        <View style={[styles.commentsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.commentsTitle, { color: colors.text, textAlign: align }]}>{copy.comments.title}</Text>

          {comments.isLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />}

          {comments.isError && <Text style={{ color: colors.danger, fontSize: 12.5 }}>{copy.comments.loadError}</Text>}

          {!comments.isLoading && commentRows.length === 0 && (
            <Text style={{ color: colors.muted, fontSize: 13 }}>{copy.comments.empty}</Text>
          )}

          {commentRows.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              author={commentAuthorById.get(comment.author_id)}
              isOwn={Boolean(viewerId) && comment.author_id === viewerId}
              onDelete={() => handleDeleteComment(comment.id)}
              onReport={() => setReportTarget({ targetType: 'comment', targetId: comment.id })}
            />
          ))}

          {comments.hasNextPage && (
            <Pressable onPress={() => comments.fetchNextPage()} style={styles.loadMoreButton} disabled={comments.isFetchingNextPage}>
              {comments.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>{copy.comments.loadMore}</Text>
              )}
            </Pressable>
          )}

          <View style={[styles.composerRow, { flexDirection: row, borderColor: colors.border }]}>
            <TextInput
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder={copy.comments.placeholder}
              placeholderTextColor={colors.muted}
              textAlign={align}
              multiline
              style={[styles.composerInput, { color: colors.text }]}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!commentBody.trim() || addComment.isPending}
              style={[styles.composerButton, { backgroundColor: colors.primary, opacity: !commentBody.trim() || addComment.isPending ? 0.5 : 1 }]}
            >
              {addComment.isPending ? <ActivityIndicator size="small" color="#0B1833" /> : <Ionicons name="send" size={16} color="#0B1833" />}
            </Pressable>
          </View>
        </View>
      </Screen>

      <ReportModal
        visible={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.targetType ?? 'post'}
        targetId={reportTarget?.targetId ?? ''}
      />
    </>
  );
}

function InteractionButton({
  icon,
  value,
  label,
  color,
  onPress,
  disabled
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress || disabled} style={[styles.interactionStat, { opacity: disabled ? 0.5 : 1 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.interactionValue, { color }]}>{value}</Text>
      <Text style={[styles.interactionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  hero: { borderWidth: 1, borderRadius: 26, padding: 20, gap: 11 },
  heroTopRow: { justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  typeText: { fontWeight: '900', fontSize: 12 },
  title: { fontSize: 26, lineHeight: 37, fontWeight: '900' },
  meta: { lineHeight: 20, fontSize: 13 },
  time: { fontSize: 11.5, fontWeight: '700' },
  bodyCard: { borderWidth: 1, borderRadius: 22, padding: 18 },
  body: { fontSize: 16.5, lineHeight: 29 },
  attachmentCard: { borderWidth: 1, borderRadius: 22, padding: 14, gap: 10 },
  attachmentLabel: { fontSize: 12, fontWeight: '800' },
  image: { width: '100%', height: 240, borderRadius: 16 },
  button: { minHeight: 54, borderRadius: 16, gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { color: '#0B1833', fontWeight: '900', fontSize: 15.5 },
  authorCard: { borderWidth: 1, borderRadius: 20, padding: 14, alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 15 },
  authorCopy: { flex: 1, gap: 2 },
  authorLabel: { fontSize: 11 },
  authorName: { fontWeight: '900', fontSize: 15 },
  interactionsRow: { borderWidth: 1, borderRadius: 20, padding: 14, justifyContent: 'space-around' },
  interactionStat: { alignItems: 'center', gap: 4 },
  interactionValue: { fontWeight: '900', fontSize: 15 },
  interactionLabel: { fontSize: 11, fontWeight: '700' },
  commentsSection: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 4 },
  commentsTitle: { fontWeight: '900', fontSize: 16, marginBottom: 6 },
  loadMoreButton: { paddingVertical: 12, alignItems: 'center' },
  loadMoreText: { fontWeight: '800', fontSize: 12.5 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 14 },
  composerInput: { flex: 1, fontSize: 13.5, maxHeight: 90, minHeight: 38, paddingVertical: 6 },
  composerButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { textAlign: 'center', fontSize: 20, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 21 }
});
