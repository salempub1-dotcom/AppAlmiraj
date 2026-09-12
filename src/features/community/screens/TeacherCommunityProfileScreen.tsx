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
import { getCommunityTheme } from '../communityTheme';

function getInitials(name?: string | null) {
  const clean = name?.trim();
  if (!clean) return '';
  return clean.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function TeacherCommunityProfileScreen({ route, navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <TeacherCommunityProfileContent route={route} navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function TeacherCommunityProfileContent({ route, navigation }: any) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
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

  const isFollowing = useIsFollowing(isOwnProfile ? '' : teacherId);
  const followMutation = useFollowTeacher();

  const postIds = useMemo(() => postRows.map((post) => post.id), [postRows]);
  const likedIds = useCommunityLikedIds(postIds);
  const savedIds = useCommunitySavedIds(postIds);
  const likeMutation = useCommunityLike();
  const saveMutation = useCommunitySave();

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
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <ActivityIndicator color={community.primary} size="large" />
        <Text style={{ color: community.textMuted }}>{copy.profile.loading}</Text>
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="person-remove-outline" size={30} color={community.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: community.text }]}>{copy.profile.loadError}</Text>
        <Text style={[styles.errorBody, { color: community.textSecondary }]}>{copy.profile.loadErrorText}</Text>
      </Screen>
    );
  }

  const teacher = profile.data;
  const levels = (teacher.level ?? []).join('، ');
  const following = isFollowing.data ?? false;
  const initials = getInitials(teacher.full_name);

  const handleToggleFollow = () => {
    followMutation.mutate(
      { teacherId, following },
      { onError: () => Alert.alert(following ? copy.follow.unfollowError : copy.follow.followError) }
    );
  };

  return (
    <Screen scroll style={{ ...styles.page, backgroundColor: community.background }}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: community.surface,
            borderColor: community.border,
            shadowColor: community.shadow
          }
        ]}
      >
        <View style={[styles.cover, { backgroundColor: community.primary }]}>
          <View style={styles.coverBubbleOne} />
          <View style={styles.coverBubbleTwo} />
        </View>

        <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.surface }]}>
          {teacher.avatar_url ? (
            <Image source={{ uri: teacher.avatar_url }} style={styles.avatarImg} />
          ) : initials ? (
            <Text style={[styles.avatarInitials, { color: community.primaryStrong }]}>{initials}</Text>
          ) : (
            <Ionicons name="person" size={40} color={community.primary} />
          )}
        </View>

        <Text style={[styles.name, { color: community.text, textAlign: 'center' }]}>{teacher.full_name ?? ''}</Text>

        {(!!teacher.subject || !!levels) && (
          <Text style={[styles.subMeta, { color: community.textSecondary, textAlign: 'center' }]}>
            {[teacher.subject, levels].filter(Boolean).join('  •  ')}
          </Text>
        )}

        {!!teacher.wilaya && (
          <View style={[styles.wilayaRow, { flexDirection: row }]}>
            <Ionicons name="location-outline" size={14} color={community.textMuted} />
            <Text style={{ color: community.textMuted, fontSize: 12.5 }}>{teacher.wilaya}</Text>
          </View>
        )}

        {!!teacher.bio && (
          <Text
            style={[
              styles.bio,
              {
                color: community.textSecondary,
                textAlign: align,
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}
          >
            {teacher.bio}
          </Text>
        )}

        {!isOwnProfile && (
          <Pressable
            onPress={handleToggleFollow}
            disabled={followMutation.isPending && followMutation.variables?.teacherId === teacherId}
            style={({ pressed }) => [
              styles.followButton,
              {
                backgroundColor: following ? community.surface : community.primary,
                borderColor: following ? community.border : community.primary,
                flexDirection: row,
                opacity:
                  followMutation.isPending && followMutation.variables?.teacherId === teacherId
                    ? 0.55
                    : pressed
                      ? 0.82
                      : 1
              }
            ]}
          >
            <Ionicons
              name={following ? 'checkmark' : 'person-add-outline'}
              size={17}
              color={following ? community.text : '#FFFFFF'}
            />
            <Text style={[styles.followButtonText, { color: following ? community.text : '#FFFFFF' }]}>
              {following ? copy.follow.following : copy.follow.follow}
            </Text>
          </Pressable>
        )}

        <View style={[styles.statsRow, { flexDirection: row, borderColor: community.divider }]}>
          <Stat value={teacher.followers_count} label={copy.profile.followers} />
          <View style={[styles.statDivider, { backgroundColor: community.divider }]} />
          <Stat value={teacher.following_count} label={copy.profile.following} />
          <View style={[styles.statDivider, { backgroundColor: community.divider }]} />
          <Stat value={teacher.posts_count} label={copy.profile.posts} />
        </View>
      </View>

      <View style={[styles.sectionHeader, { flexDirection: row }]}>
        <Text style={[styles.sectionTitle, { color: community.text, textAlign: align }]}>{copy.profile.postsTitle}</Text>
        <View style={[styles.sectionIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="newspaper-outline" size={17} color={community.primary} />
        </View>
      </View>

      {posts.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={community.primary} /></View>
      ) : postRows.length === 0 ? (
        <View style={[styles.emptyPosts, { backgroundColor: community.surface, borderColor: community.border }]}>
          <Ionicons name="newspaper-outline" size={27} color={community.textMuted} />
          <Text style={[styles.emptyPostsText, { color: community.textMuted }]}>{copy.profile.noPosts}</Text>
        </View>
      ) : (
        <View style={styles.postsList}>
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
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: community.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: community.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18, paddingBottom: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  errorBody: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  hero: { borderWidth: 1, borderRadius: 26, overflow: 'hidden', paddingBottom: 18 },
  cover: { height: 116, position: 'relative', overflow: 'hidden' },
  coverBubbleOne: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.10)', right: -25, top: -45 },
  coverBubbleTwo: { position: 'absolute', width: 95, height: 95, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.08)', left: 12, bottom: -32 },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 5, alignSelf: 'center', marginTop: -43, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  name: { marginTop: 11, paddingHorizontal: 18, fontSize: 22, fontWeight: '900' },
  subMeta: { paddingHorizontal: 18, marginTop: 4, fontSize: 12.5, fontWeight: '600' },
  wilayaRow: { alignSelf: 'center', alignItems: 'center', gap: 4, marginTop: 6 },
  bio: { marginTop: 12, paddingHorizontal: 20, fontSize: 13, lineHeight: 20 },
  followButton: { alignSelf: 'center', marginTop: 14, borderWidth: 1, minHeight: 42, borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', gap: 7 },
  followButtonText: { fontSize: 13, fontWeight: '800' },
  statsRow: { marginTop: 18, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginHorizontal: 16, alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '900' },
  statLabel: { marginTop: 2, fontSize: 10.5, fontWeight: '600' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '900' },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  postsList: { gap: 12 },
  emptyPosts: { borderWidth: 1, borderRadius: 18, minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  emptyPostsText: { fontSize: 13, fontWeight: '600', textAlign: 'center' }
});
