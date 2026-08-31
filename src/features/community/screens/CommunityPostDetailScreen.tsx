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
import { useDeleteCommunityPost, useSetOwnCommunityPostVisibility } from '../../../hooks/useCommunityPostOwner';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { CommentRow } from '../components/CommentRow';
import { ReportModal } from '../components/ReportModal';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { communityTypeIcons } from '../contentTypeIcons';
import { getCommunityTheme, getCommunityTypeTone } from '../communityTheme';

// Gated the same way as the feed: every data hook below only runs once a
// session is confirmed (see TeacherSpaceGate).
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
  const community = getCommunityTheme(colors);
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const postId = String(route.params?.postId ?? '');

  const detail = useCommunityPostDetail(postId);
  const author = useTeacherPublicProfile(detail.data?.author_id ?? '');

  // Like/save - single-post lookup using the existing interaction hooks.
  const likedIds = useCommunityLikedIds([postId]);
  const savedIds = useCommunitySavedIds([postId]);
  const likeMutation = useCommunityLike();
  const saveMutation = useCommunitySave();
  const liked = likedIds.data?.has(postId) ?? false;
  const saved = savedIds.data?.has(postId) ?? false;

  // Comments remain paginated and author profiles remain batched.
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

  const visibilityMutation = useSetOwnCommunityPostVisibility();
  const deletePostMutation = useDeleteCommunityPost();

  if (detail.isLoading) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <ActivityIndicator color={community.primary} size="large" />
        <Text style={{ color: community.textMuted }}>{copy.detail.loading}</Text>
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="alert-circle-outline" size={30} color={community.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: community.text }]}>{copy.detail.loadError}</Text>
        <Text style={[styles.errorBody, { color: community.textSecondary }]}>{copy.detail.loadErrorText}</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.button, { backgroundColor: community.primary }]}>
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>{copy.detail.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  const post = detail.data;
  const meta = [post.subject, ...(post.level ?? [])].filter(Boolean);
  const isOwnPost = Boolean(viewerId) && post.author_id === viewerId;
  const typeTone = getCommunityTypeTone(post.type, community);

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

  const handleToggleVisibility = () => {
    const nextStatus = post.status === 'hidden' ? 'visible' : 'hidden';

    visibilityMutation.mutate(
      { postId: post.id, status: nextStatus },
      {
        onSuccess: () => Alert.alert(nextStatus === 'hidden' ? copy.owner.hideSuccess : copy.owner.showSuccess),
        onError: () => Alert.alert(copy.owner.statusError)
      }
    );
  };

  const handleDeletePost = () => {
    Alert.alert(copy.owner.deleteConfirmTitle, copy.owner.deleteConfirmText, [
      { text: copy.owner.cancel, style: 'cancel' },
      {
        text: copy.owner.confirmDelete,
        style: 'destructive',
        onPress: () =>
          deletePostMutation.mutate(
            { postId: post.id, media: post.media },
            {
              onSuccess: () => {
                Alert.alert(copy.owner.deleteSuccess);
                navigation.goBack();
              },
              onError: () => Alert.alert(copy.owner.deleteError)
            }
          )
      }
    ]);
  };

  const handleOwnerMenu = () => {
    Alert.alert(copy.detail.moreOptions, undefined, [
      { text: copy.owner.edit, onPress: () => navigation.navigate('EditCommunityPost', { postId: post.id }) },
      { text: post.status === 'hidden' ? copy.owner.show : copy.owner.hide, onPress: handleToggleVisibility },
      { text: copy.owner.delete, style: 'destructive', onPress: handleDeletePost },
      { text: copy.owner.cancel, style: 'cancel' }
    ]);
  };

  const ownerBusy =
    (visibilityMutation.isPending && visibilityMutation.variables?.postId === post.id) ||
    (deletePostMutation.isPending && deletePostMutation.variables?.postId === post.id);

  return (
    <>
      <Screen scroll style={{ ...styles.page, backgroundColor: community.background }}>
        <View
          style={[
            styles.postCard,
            {
              backgroundColor: community.surface,
              borderColor: community.border,
              shadowColor: community.shadow
            }
          ]}
        >
          <View style={[styles.authorRow, { flexDirection: row }]}>
            <Pressable
              onPress={() => navigation.navigate('TeacherCommunityProfile', { teacherId: post.author_id })}
              style={[styles.authorLockup, { flexDirection: row }]}
            >
              <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.border }]}>
                {author.data?.avatar_url ? (
                  <Image source={{ uri: author.data.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={21} color={community.primary} />
                )}
              </View>

              <View style={styles.authorCopy}>
                <Text numberOfLines={1} style={[styles.authorName, { color: community.text, textAlign: align }]}>
                  {author.data?.full_name ?? '…'}
                </Text>
                <View style={[styles.authorMetaRow, { flexDirection: row }]}>
                  {!!author.data?.subject && (
                    <Text numberOfLines={1} style={[styles.authorMeta, { color: community.textSecondary }]}>
                      {author.data.subject}
                    </Text>
                  )}
                  {!!author.data?.subject && <View style={[styles.metaDot, { backgroundColor: community.textMuted }]} />}
                  <Text style={[styles.time, { color: community.textMuted }]}>
                    {formatRelativeTime(post.created_at, language)}
                  </Text>
                </View>
              </View>
            </Pressable>

            {isOwnPost ? (
              <Pressable
                onPress={handleOwnerMenu}
                disabled={ownerBusy}
                hitSlop={10}
                accessibilityLabel={copy.detail.moreOptions}
                style={({ pressed }) => [
                  styles.moreButton,
                  {
                    backgroundColor: pressed ? community.primarySoft : 'transparent',
                    opacity: ownerBusy ? 0.5 : 1
                  }
                ]}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={community.textSecondary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setReportTarget({ targetType: 'post', targetId: post.id })}
                hitSlop={10}
                accessibilityLabel={copy.detail.moreOptions}
                style={({ pressed }) => [
                  styles.moreButton,
                  { backgroundColor: pressed ? community.primarySoft : 'transparent' }
                ]}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={community.textSecondary} />
              </Pressable>
            )}
          </View>

          <View style={[styles.badgesRow, { flexDirection: row }]}>
            <View style={[styles.typeBadge, { backgroundColor: typeTone.background, flexDirection: row }]}>
              <Ionicons name={communityTypeIcons[post.type]} size={15} color={typeTone.foreground} />
              <Text style={[styles.typeText, { color: typeTone.foreground }]}>{copy.types[post.type]}</Text>
            </View>

            {isOwnPost && post.status === 'hidden' && (
              <View style={[styles.hiddenBadge, { backgroundColor: `${community.danger}14`, flexDirection: row }]}>
                <Ionicons name="eye-off-outline" size={13} color={community.danger} />
                <Text style={[styles.hiddenBadgeText, { color: community.danger }]}>{copy.card.hiddenBadge}</Text>
              </View>
            )}
          </View>

          {!!post.title && (
            <Text
              numberOfLines={6}
              style={[
                styles.title,
                {
                  color: community.text,
                  textAlign: align,
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}
            >
              {post.title}
            </Text>
          )}

          {!!post.body && (
            <Text
              style={[
                styles.body,
                {
                  color: community.textSecondary,
                  textAlign: align,
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}
            >
              {post.body}
            </Text>
          )}

          {meta.length > 0 && (
            <View style={[styles.metaWrap, { flexDirection: row }]}>
              {meta.map((item) => (
                <View key={item} style={[styles.metaChip, { backgroundColor: community.primarySoft }]}>
                  <Text style={[styles.metaChipText, { color: community.primaryStrong }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {post.media?.type === 'image' && !!post.media.url && (
            <View style={[styles.imageShell, { backgroundColor: community.imageBackdrop }]}>
              <Image source={{ uri: post.media.url }} style={styles.image} resizeMode="cover" />
            </View>
          )}

          {post.media?.type === 'pdf' && !!post.media.url && (
            <Pressable
              onPress={() => Linking.openURL(post.media.url!)}
              style={({ pressed }) => [
                styles.pdfCard,
                {
                  backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC',
                  borderColor: community.border,
                  flexDirection: row,
                  opacity: pressed ? 0.78 : 1
                }
              ]}
            >
              <View style={[styles.pdfIcon, { backgroundColor: community.primarySoft }]}>
                <Ionicons name="document-text-outline" size={22} color={community.primary} />
              </View>
              <View style={styles.pdfCopy}>
                <Text numberOfLines={1} style={[styles.pdfTitle, { color: community.text, textAlign: align }]}>
                  {post.media.name || copy.detail.openPdf}
                </Text>
                <Text style={[styles.pdfMeta, { color: community.textMuted, textAlign: align }]}>PDF</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={community.textMuted} />
            </Pressable>
          )}

          <View style={[styles.divider, { backgroundColor: community.divider }]} />

          <View style={[styles.interactionsRow, { flexDirection: row }]}>
            <InteractionButton
              icon={liked ? 'heart' : 'heart-outline'}
              value={post.likes_count}
              label={liked ? copy.interactions.liked : copy.interactions.like}
              active={liked}
              activeColor={community.primary}
              inactiveColor={community.textSecondary}
              activeBackground={community.primarySoft}
              onPress={() => likeMutation.mutate({ postId, liked })}
              disabled={likeMutation.isPending && likeMutation.variables?.postId === postId}
            />
            <InteractionButton
              icon="chatbubble-outline"
              value={post.comments_count}
              label={copy.interactions.comment}
              active={false}
              activeColor={community.primary}
              inactiveColor={community.textSecondary}
              activeBackground={community.primarySoft}
            />
            <InteractionButton
              icon={saved ? 'bookmark' : 'bookmark-outline'}
              value={post.saves_count}
              label={saved ? copy.interactions.saved : copy.interactions.save}
              active={saved}
              activeColor={community.primary}
              inactiveColor={community.textSecondary}
              activeBackground={community.primarySoft}
              onPress={() => saveMutation.mutate({ postId, saved })}
              disabled={saveMutation.isPending && saveMutation.variables?.postId === postId}
            />
          </View>
        </View>

        <View
          style={[
            styles.commentsSection,
            {
              backgroundColor: community.surface,
              borderColor: community.border,
              shadowColor: community.shadow
            }
          ]}
        >
          <View style={[styles.commentsHeader, { flexDirection: row }]}>
            <Text style={[styles.commentsTitle, { color: community.text, textAlign: align }]}>{copy.comments.title}</Text>
            <View style={[styles.commentsCount, { backgroundColor: community.primarySoft }]}>
              <Text style={[styles.commentsCountText, { color: community.primary }]}>{post.comments_count}</Text>
            </View>
          </View>

          {comments.isLoading && <ActivityIndicator color={community.primary} style={{ marginVertical: 10 }} />}

          {comments.isError && (
            <Text style={{ color: community.danger, fontSize: 12.5 }}>{copy.comments.loadError}</Text>
          )}

          {!comments.isLoading && commentRows.length === 0 && (
            <View style={styles.commentsEmpty}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={community.textMuted} />
              <Text style={{ color: community.textMuted, fontSize: 13 }}>{copy.comments.empty}</Text>
            </View>
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
                <ActivityIndicator color={community.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: community.primary }]}>{copy.comments.loadMore}</Text>
              )}
            </Pressable>
          )}

          <View style={[styles.composerRow, { flexDirection: row, borderColor: community.border }]}>
            <View
              style={[
                styles.composerInputShell,
                {
                  backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC',
                  borderColor: community.border
                }
              ]}
            >
              <TextInput
                value={commentBody}
                onChangeText={setCommentBody}
                placeholder={copy.comments.placeholder}
                placeholderTextColor={community.textMuted}
                textAlign={align}
                multiline
                style={[styles.composerInput, { color: community.text }]}
              />
            </View>

            <Pressable
              onPress={handleSubmitComment}
              disabled={!commentBody.trim() || addComment.isPending}
              style={[
                styles.composerButton,
                {
                  backgroundColor: community.primary,
                  opacity: !commentBody.trim() || addComment.isPending ? 0.45 : 1
                }
              ]}
            >
              {addComment.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={isRTL ? 'send' : 'send'} size={17} color="#FFFFFF" />
              )}
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
  active,
  activeColor,
  inactiveColor,
  activeBackground,
  onPress,
  disabled
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  active?: boolean;
  activeColor: string;
  inactiveColor: string;
  activeBackground: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const color = active ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => [
        styles.interactionStat,
        {
          backgroundColor: active ? activeBackground : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1
        }
      ]}
    >
      <Ionicons name={icon} size={19} color={color} />
      <View style={styles.interactionCopy}>
        <Text style={[styles.interactionValue, { color }]}>{value}</Text>
        <Text numberOfLines={1} style={[styles.interactionLabel, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
    paddingBottom: 28
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  postCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 11,
    gap: 13,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  authorRow: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  authorLockup: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 10
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23
  },
  authorCopy: {
    flex: 1,
    minWidth: 0
  },
  authorName: {
    fontWeight: '900',
    fontSize: 14.5
  },
  authorMetaRow: {
    marginTop: 3,
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  authorMeta: {
    fontSize: 11.5,
    fontWeight: '600',
    maxWidth: 135
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999
  },
  time: {
    fontSize: 11,
    fontWeight: '600'
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgesRow: {
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  typeBadge: {
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  typeText: {
    fontWeight: '800',
    fontSize: 11.5
  },
  hiddenBadge: {
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  hiddenBadgeText: {
    fontWeight: '800',
    fontSize: 10.5
  },
  title: {
    fontSize: 21,
    lineHeight: 31,
    fontWeight: '900'
  },
  body: {
    fontSize: 15,
    lineHeight: 25,
    fontWeight: '500'
  },
  metaWrap: {
    flexWrap: 'wrap',
    gap: 6
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '800'
  },
  imageShell: {
    width: '100%',
    borderRadius: 17,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: 260
  },
  pdfCard: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 9,
    alignItems: 'center',
    gap: 10
  },
  pdfIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pdfCopy: {
    flex: 1,
    minWidth: 0
  },
  pdfTitle: {
    fontWeight: '800',
    fontSize: 13
  },
  pdfMeta: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: '700'
  },
  divider: {
    height: StyleSheet.hairlineWidth
  },
  interactionsRow: {
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  interactionStat: {
    minWidth: 88,
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  interactionCopy: {
    alignItems: 'flex-start'
  },
  interactionValue: {
    fontWeight: '900',
    fontSize: 12
  },
  interactionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    maxWidth: 52
  },
  commentsSection: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 8,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  commentsHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  commentsTitle: {
    fontWeight: '900',
    fontSize: 17
  },
  commentsCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentsCountText: {
    fontSize: 11,
    fontWeight: '900'
  },
  commentsEmpty: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 7
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  loadMoreText: {
    fontWeight: '800',
    fontSize: 12.5
  },
  composerRow: {
    alignItems: 'flex-end',
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    paddingTop: 12
  },
  composerInputShell: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 22,
    justifyContent: 'center'
  },
  composerInput: {
    fontSize: 13.5,
    maxHeight: 90,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  composerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14
  },
  errorTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900'
  },
  errorBody: {
    textAlign: 'center',
    lineHeight: 21
  }
});
