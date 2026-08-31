import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useTeacherCommunityPosts, useTeacherPublicProfile } from '../../../hooks/useCommunity';
import {
  useCommunityLike,
  useCommunityLikedIds,
  useCommunitySave,
  useCommunitySavedIds,
  useFollowTeacher,
  useIsFollowing
} from '../../../hooks/useCommunityInteractions';
import { useDeleteCommunityPost, useSetOwnCommunityPostVisibility } from '../../../hooks/useCommunityPostOwner';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost } from '../../../repositories/communityRepository';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';

// Displays ONLY the fields returned by public.get_public_teacher_profiles():
// full_name, avatar, subject, level, wilaya, bio, followers/following/posts
// counts. It never reads `profiles` directly, so phone/email/notif_prefs/
// role can never appear here even by accident. Gated the same way as the
// rest of Teacher Space - see TeacherSpaceGate.
export function TeacherCommunityProfileScreen({ route, navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <TeacherCommunityProfileContent route={route} navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function TeacherCommunityProfileContent({ route, navigation }: any) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const teacherId = String(route.params?.teacherId ?? '');
  const isOwnProfile = Boolean(viewerId) && viewerId === teacherId;

  const profile = useTeacherPublicProfile(teacherId);
  const posts = useTeacherCommunityPosts(teacherId);
  const postRows = useMemo(() => posts.data?.pages.flat() ?? [], [posts.data]);

  // Follow state/action - no button at all on your own profile, so this
  // hook is only ever meaningfully used for another teacher's profile.
  const isFollowing = useIsFollowing(isOwnProfile ? '' : teacherId);
  const followMutation = useFollowTeacher();

  // Same batched like/save pattern as the feed, scoped to this teacher's
  // currently-loaded posts.
  const postIds = useMemo(() => postRows.map((post) => post.id), [postRows]);
  const likedIds = useCommunityLikedIds(postIds);
  const savedIds = useCommunitySavedIds(postIds);
  const likeMutation = useCommunityLike();
  const saveMutation = useCommunitySave();

  // Owner-only actions (Phase F). Only ever wired up for the current
  // teacher's own posts - see isOwner={isOwnProfile} below. RLS still gates
  // the actual mutations (community_posts_own_update / _own_delete).
  const visibilityMutation = useSetOwnCommunityPostVisibility();
  const deleteMutation = useDeleteCommunityPost();

  const handleToggleVisibility = (post: CommunityPost) => {
    const nextStatus = post.status === 'hidden' ? 'visible' : 'hidden';
    visibilityMutation.mutate(
      { postId: post.id, status: nextStatus },
      {
        onSuccess: () => Alert.alert(nextStatus === 'hidden' ? copy.owner.hideSuccess : copy.owner.showSuccess),
        onError: () => Alert.alert(copy.owner.statusError)
      }
    );
  };

  const handleDeletePost = (post: CommunityPost) => {
    Alert.alert(copy.owner.deleteConfirmTitle, copy.owner.deleteConfirmText, [
      { text: copy.owner.cancel, style: 'cancel' },
      {
        text: copy.owner.confirmDelete,
        style: 'destructive',
        onPress: () =>
          deleteMutation.mutate(
            { postId: post.id, media: post.media },
            {
              onSuccess: () => Alert.alert(copy.owner.deleteSuccess),
              onError: () => Alert.alert(copy.owner.deleteError)
            }
          )
      }
    ]);
  };

  if (profile.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>{copy.profile.loading}</Text>
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="person-remove-outline" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{copy.profile.loadError}</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>{copy.profile.loadErrorText}</Text>
      </Screen>
    );
  }

  const teacher = profile.data;
  const levels = (teacher.level ?? []).join('، ');
  const following = isFollowing.data ?? false;

  const handleToggleFollow = () => {
    followMutation.mutate(
      { teacherId, following },
      { onError: () => Alert.alert(following ? copy.follow.unfollowError : copy.follow.followError) }
    );
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}18`, alignSelf: 'center' }]}>
          {teacher.avatar_url ? (
            <Image source={{ uri: teacher.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={34} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.name, { color: colors.text, textAlign: 'center' }]}>{teacher.full_name ?? ''}</Text>
        {(!!teacher.subject || !!levels) && (
          <Text style={[styles.subMeta, { color: colors.muted, textAlign: 'center' }]}>
            {[teacher.subject, levels].filter(Boolean).join('  •  ')}
          </Text>
        )}
        {!!teacher.wilaya && (
          <View style={[styles.wilayaRow, { flexDirection: row, alignSelf: 'center' }]}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 12.5 }}>{teacher.wilaya}</Text>
          </View>
        )}

        {!!teacher.bio && (
          <Text style={[styles.bio, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{teacher.bio}</Text>
        )}

        {!isOwnProfile && (
          <Pressable
            onPress={handleToggleFollow}
            disabled={followMutation.isPending && followMutation.variables?.teacherId === teacherId}
            style={[
              styles.followButton,
              {
                backgroundColor: following ? colors.background : colors.primary,
                borderColor: following ? colors.border : colors.primary,
                flexDirection: row,
                opacity: followMutation.isPending && followMutation.variables?.teacherId === teacherId ? 0.6 : 1
              }
            ]}
          >
            <Ionicons name={following ? 'checkmark' : 'person-add-outline'} size={16} color={following ? colors.text : '#0B1833'} />
            <Text style={[styles.followButtonText, { color: following ? colors.text : '#0B1833' }]}>
              {following ? copy.follow.following : copy.follow.follow}
            </Text>
          </Pressable>
        )}

        <View style={[styles.statsRow, { flexDirection: row, borderColor: colors.border }]}>
          <Stat value={teacher.followers_count} label={copy.profile.followers} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat value={teacher.following_count} label={copy.profile.following} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat value={teacher.posts_count} label={copy.profile.posts} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{copy.profile.postsTitle}</Text>

      {posts.isLoading && <ActivityIndicator color={colors.primary} />}

      {!posts.isLoading && postRows.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>{copy.profile.noPosts}</Text>
        </View>
      )}

      <View style={styles.list}>
        {postRows.map((post) => {
          const liked = likedIds.data?.has(post.id) ?? false;
          const saved = savedIds.data?.has(post.id) ?? false;
          const ownerBusy =
            (visibilityMutation.isPending && visibilityMutation.variables?.postId === post.id) ||
            (deleteMutation.isPending && deleteMutation.variables?.postId === post.id);
          return (
            <CommunityPostCard
              key={post.id}
              post={post}
              author={teacher}
              onPress={() => navigation.navigate('CommunityPostDetail', { postId: post.id })}
              liked={liked}
              saved={saved}
              onToggleLike={() => likeMutation.mutate({ postId: post.id, liked })}
              onToggleSave={() => saveMutation.mutate({ postId: post.id, saved })}
              likePending={likeMutation.isPending && likeMutation.variables?.postId === post.id}
              savePending={saveMutation.isPending && saveMutation.variables?.postId === post.id}
              isOwner={isOwnProfile}
              onEdit={() => navigation.navigate('EditCommunityPost', { postId: post.id })}
              onDeletePost={() => handleDeletePost(post)}
              onToggleVisibility={() => handleToggleVisibility(post)}
              ownerBusy={ownerBusy}
              showHiddenBadge={isOwnProfile && post.status === 'hidden'}
            />
          );
        })}
      </View>

      {posts.hasNextPage && (
        <Pressable onPress={() => posts.fetchNextPage()} style={styles.loadMoreButton} disabled={posts.isFetchingNextPage}>
          {posts.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{copy.profile.loadingMore}</Text>
          )}
        </Pressable>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  hero: { borderWidth: 1, borderRadius: 26, padding: 22, gap: 10, alignItems: 'center' },
  avatar: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 74, height: 74, borderRadius: 24 },
  name: { fontSize: 22, fontWeight: '900' },
  subMeta: { fontSize: 13 },
  wilayaRow: { alignItems: 'center', gap: 5 },
  bio: { fontSize: 14.5, lineHeight: 23, width: '100%', marginTop: 4 },
  followButton: { minHeight: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 },
  followButtonText: { fontWeight: '900', fontSize: 13.5 },
  statsRow: { width: '100%', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 14, justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 3 },
  statValue: { fontWeight: '900', fontSize: 17 },
  statLabel: { fontSize: 11.5 },
  statDivider: { width: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  emptyCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  list: { gap: 13 },
  loadMoreButton: { paddingVertical: 16, alignItems: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 21 }
});
