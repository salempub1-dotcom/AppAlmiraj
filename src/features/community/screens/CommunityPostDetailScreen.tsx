import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
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

type ReportTarget = { targetType: 'post' | 'comment'; targetId: string } | null;

export function CommunityPostDetailScreen({ route, navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CommunityPostDetailContent route={route} navigation={navigation} />
    </TeacherSpaceGate>
  );
}

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
  const likedIds = useCommunityLikedIds([postId]);
  const savedIds = useCommunitySavedIds([postId]);
  const likeMutation = useCommunityLike();
  const saveMutation = useCommunitySave();
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
  const visibilityMutation = useSetOwnCommunityPostVisibility();
  const deletePostMutation = useDeleteCommunityPost();
  const [commentBody, setCommentBody] = useState('');
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);

  if (detail.isLoading) {
    return <Screen style={[styles.center, { backgroundColor: community.background }]}><ActivityIndicator color={community.gold} size="large" /></Screen>;
  }
  if (detail.isError || !detail.data) {
    return (
      <Screen style={[styles.center, { backgroundColor: community.background }]}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="alert-circle-outline" size={30} color={community.primary} /></View>
        <Text style={[styles.errorTitle, { color: community.text }]}>{copy.detail.loadError}</Text>
        <Text style={[styles.errorBody, { color: community.textSecondary }]}>{copy.detail.loadErrorText}</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.retry, { backgroundColor: community.text }]}><Text style={[styles.retryText, { color: community.surface }]}>{copy.detail.retry}</Text></Pressable>
      </Screen>
    );
  }

  const post = detail.data;
  const teacher = author.data;
  const liked = likedIds.data?.has(postId) ?? false;
  const saved = savedIds.data?.has(postId) ?? false;
  const isOwnPost = Boolean(viewerId) && post.author_id === viewerId;
  const typeTone = getCommunityTypeTone(post.type, community);
  const meta = [post.subject, ...(post.level ?? [])].filter(Boolean);

  const submitComment = () => {
    const body = commentBody.trim();
    if (!body || addComment.isPending) return;
    addComment.mutate(body, { onSuccess: () => setCommentBody(''), onError: () => Alert.alert(copy.comments.postError) });
  };

  const toggleVisibility = () => {
    const status = post.status === 'hidden' ? 'visible' : 'hidden';
    visibilityMutation.mutate({ postId: post.id, status }, { onError: () => Alert.alert(copy.owner.statusError) });
  };

  const deletePost = () => {
    Alert.alert(copy.owner.deleteConfirmTitle, copy.owner.deleteConfirmText, [
      { text: copy.owner.cancel, style: 'cancel' },
      { text: copy.owner.confirmDelete, style: 'destructive', onPress: () => deletePostMutation.mutate({ postId: post.id, media: post.media }, { onSuccess: () => navigation.goBack(), onError: () => Alert.alert(copy.owner.deleteError) }) }
    ]);
  };

  const moreMenu = () => {
    if (!isOwnPost) return setReportTarget({ targetType: 'post', targetId: post.id });
    Alert.alert(copy.detail.moreOptions, undefined, [
      { text: copy.owner.edit, onPress: () => navigation.navigate('EditCommunityPost', { postId: post.id }) },
      { text: post.status === 'hidden' ? copy.owner.show : copy.owner.hide, onPress: toggleVisibility },
      { text: copy.owner.delete, style: 'destructive', onPress: deletePost },
      { text: copy.owner.cancel, style: 'cancel' }
    ]);
  };

  const sharePost = async () => {
    const message = [post.title, post.body, post.media?.url].filter(Boolean).join('\n\n');
    try { await Share.share({ message }); } catch {}
  };

  return (
    <>
      <Screen scroll style={[styles.page, { backgroundColor: community.background }]}>
        <View style={[styles.postCard, { backgroundColor: community.surface, borderColor: community.border }]}> 
          <View style={[styles.authorRow, { flexDirection: row }]}> 
            <Pressable onPress={() => navigation.navigate('TeacherCommunityProfile', { teacherId: post.author_id })} style={[styles.authorLockup, { flexDirection: row }]}>
              <View style={[styles.avatarRing, { borderColor: community.gold }]}>
                <View style={[styles.avatar, { backgroundColor: community.primarySoft }]}>
                  {teacher?.avatar_url ? <Image source={{ uri: teacher.avatar_url }} style={styles.avatarImg} /> : <Ionicons name="person" size={21} color={community.primary} />}
                </View>
              </View>
              <View style={styles.authorCopy}>
                <Text numberOfLines={1} style={[styles.authorName, { color: community.text, textAlign: align }]}>{teacher?.full_name ?? '…'}</Text>
                <Text numberOfLines={1} style={[styles.authorMeta, { color: community.textMuted, textAlign: align }]}>{[teacher?.subject, formatRelativeTime(post.created_at, language)].filter(Boolean).join(' · ')}</Text>
              </View>
            </Pressable>
            <Pressable onPress={moreMenu} hitSlop={10} style={styles.moreButton}><Ionicons name="ellipsis-vertical" size={20} color={community.textSecondary} /></Pressable>
          </View>

          <View style={[styles.typeRow, { flexDirection: row }]}> 
            <View style={[styles.typeBadge, { backgroundColor: typeTone.background, flexDirection: row }]}>
              <Ionicons name={communityTypeIcons[post.type]} size={13} color={typeTone.foreground} />
              <Text style={[styles.typeText, { color: typeTone.foreground }]}>{copy.types[post.type]}</Text>
            </View>
            {isOwnPost && post.status === 'hidden' ? <Text style={[styles.hiddenText, { color: community.danger }]}>{copy.card.hiddenBadge}</Text> : null}
          </View>

          {!!post.title && <Text style={[styles.title, { color: community.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{post.title}</Text>}
          {!!post.body && <Text style={[styles.body, { color: community.textSecondary, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{post.body}</Text>}

          {meta.length > 0 && <View style={[styles.metaWrap, { flexDirection: row }]}>{meta.map((item) => <Text key={String(item)} style={[styles.metaText, { color: community.primaryStrong }]}>#{String(item).replace(/\s+/g, '')}</Text>)}</View>}

          {post.media?.type === 'image' && !!post.media.url && <View style={[styles.imageShell, { backgroundColor: community.imageBackdrop }]}><Image source={{ uri: post.media.url }} style={styles.image} resizeMode="cover" /></View>}
          {post.media?.type === 'pdf' && !!post.media.url && (
            <Pressable onPress={() => Linking.openURL(post.media.url!)} style={[styles.pdfCard, { backgroundColor: community.surfaceRaised, borderColor: community.border, flexDirection: row }]}>
              <View style={[styles.pdfIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="document-text-outline" size={23} color={community.primary} /></View>
              <View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.pdfTitle, { color: community.text, textAlign: align }]}>{post.media.name || copy.detail.openPdf}</Text><Text style={[styles.pdfMeta, { color: community.textMuted, textAlign: align }]}>PDF</Text></View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={community.textMuted} />
            </Pressable>
          )}

          <View style={[styles.engagementSummary, { flexDirection: row, borderBottomColor: community.divider }]}>
            <Text style={[styles.engagementText, { color: community.textMuted }]}>{post.likes_count} {language === 'ar' ? 'إعجاب' : 'likes'}</Text>
            <Text style={[styles.engagementText, { color: community.textMuted }]}>{post.comments_count} {language === 'ar' ? 'تعليق' : 'comments'}</Text>
          </View>

          <View style={[styles.actions, { flexDirection: row }]}> 
            <ActionButton icon={liked ? 'heart' : 'heart-outline'} label={copy.interactions.like} color={liked ? '#ED4956' : community.textSecondary} onPress={() => likeMutation.mutate({ postId, liked })} />
            <ActionButton icon="chatbubble-outline" label={copy.interactions.comment} color={community.textSecondary} />
            <ActionButton icon="paper-plane-outline" label={language === 'ar' ? 'مشاركة' : 'Share'} color={community.textSecondary} onPress={sharePost} />
            <ActionButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={copy.interactions.save} color={saved ? community.gold : community.textSecondary} onPress={() => saveMutation.mutate({ postId, saved })} />
          </View>
        </View>

        <View style={[styles.commentsCard, { backgroundColor: community.surface, borderColor: community.border }]}> 
          <View style={[styles.commentsHeader, { flexDirection: row }]}>
            <Text style={[styles.commentsTitle, { color: community.text }]}>{copy.comments.title}</Text>
            <View style={[styles.countPill, { backgroundColor: community.primarySoft }]}><Text style={[styles.countText, { color: community.primary }]}>{post.comments_count}</Text></View>
          </View>

          {comments.isLoading ? <ActivityIndicator color={community.gold} style={{ marginVertical: 16 }} /> : null}
          {!comments.isLoading && commentRows.length === 0 ? <View style={styles.emptyComments}><Ionicons name="chatbubble-ellipses-outline" size={27} color={community.textMuted} /><Text style={{ color: community.textMuted }}>{copy.comments.empty}</Text></View> : null}
          {commentRows.map((comment) => (
            <CommentRow key={comment.id} comment={comment} author={commentAuthorById.get(comment.author_id)} isOwn={Boolean(viewerId) && comment.author_id === viewerId} onDelete={() => deleteComment.mutate(comment.id)} onReport={() => setReportTarget({ targetType: 'comment', targetId: comment.id })} />
          ))}
          {comments.hasNextPage ? <Pressable onPress={() => comments.fetchNextPage()} style={styles.loadMore}><Text style={[styles.loadMoreText, { color: community.primary }]}>{copy.comments.loadMore}</Text></Pressable> : null}

          <View style={[styles.composer, { flexDirection: row, borderTopColor: community.divider }]}> 
            <View style={[styles.miniAvatar, { backgroundColor: community.primarySoft }]}><Ionicons name="person" size={16} color={community.primary} /></View>
            <TextInput value={commentBody} onChangeText={setCommentBody} placeholder={copy.comments.placeholder} placeholderTextColor={community.textMuted} textAlign={align} multiline style={[styles.commentInput, { color: community.text, backgroundColor: community.surfaceRaised, borderColor: community.border }]} />
            <Pressable disabled={!commentBody.trim() || addComment.isPending} onPress={submitComment} style={[styles.sendButton, { backgroundColor: community.primary, opacity: !commentBody.trim() || addComment.isPending ? 0.4 : 1 }]}>
              {addComment.isPending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={17} color="#FFFFFF" />}
            </Pressable>
          </View>
        </View>
      </Screen>

      <ReportModal visible={Boolean(reportTarget)} onClose={() => setReportTarget(null)} targetType={reportTarget?.targetType ?? 'post'} targetId={reportTarget?.targetId ?? ''} />
    </>
  );
}

function ActionButton({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.55 : 1 }]}><Ionicons name={icon} size={22} color={color} /><Text numberOfLines={1} style={[styles.actionLabel, { color }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: 12, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  stateIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center' },
  errorBody: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retry: { minHeight: 46, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontWeight: '900' },
  postCard: { borderWidth: 1, borderRadius: 22, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  authorRow: { alignItems: 'center', justifyContent: 'space-between' },
  authorLockup: { flex: 1, minWidth: 0, alignItems: 'center', gap: 10 },
  avatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.7, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 39, height: 39, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  authorCopy: { flex: 1, minWidth: 0 },
  authorName: { fontSize: 14.5, fontWeight: '900' },
  authorMeta: { marginTop: 3, fontSize: 11.5, fontWeight: '600' },
  moreButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  typeRow: { alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeBadge: { alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  typeText: { fontSize: 10.5, fontWeight: '800' },
  hiddenText: { fontSize: 10.5, fontWeight: '800' },
  title: { fontSize: 20, lineHeight: 29, fontWeight: '900' },
  body: { fontSize: 14.5, lineHeight: 24, fontWeight: '500' },
  metaWrap: { flexWrap: 'wrap', gap: 7 },
  metaText: { fontSize: 11.5, fontWeight: '700' },
  imageShell: { width: '100%', borderRadius: 17, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.15 },
  pdfCard: { borderWidth: 1, borderRadius: 16, padding: 10, alignItems: 'center', gap: 10 },
  pdfIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pdfTitle: { fontSize: 13, fontWeight: '800' },
  pdfMeta: { marginTop: 2, fontSize: 10.5, fontWeight: '700' },
  engagementSummary: { justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  engagementText: { fontSize: 11.5, fontWeight: '600' },
  actions: { justifyContent: 'space-between', alignItems: 'center' },
  actionButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', gap: 3 },
  actionLabel: { fontSize: 9.5, fontWeight: '700' },
  commentsCard: { borderWidth: 1, borderRadius: 22, padding: 14, gap: 9 },
  commentsHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  commentsTitle: { fontSize: 17, fontWeight: '900' },
  countPill: { minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 11, fontWeight: '900' },
  emptyComments: { paddingVertical: 20, alignItems: 'center', gap: 7 },
  loadMore: { paddingVertical: 10, alignItems: 'center' },
  loadMoreText: { fontSize: 12.5, fontWeight: '800' },
  composer: { alignItems: 'flex-end', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4 },
  miniAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  commentInput: { flex: 1, minHeight: 42, maxHeight: 100, borderWidth: 1, borderRadius: 21, paddingHorizontal: 13, paddingVertical: 9, fontSize: 13.5 },
  sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }
});
