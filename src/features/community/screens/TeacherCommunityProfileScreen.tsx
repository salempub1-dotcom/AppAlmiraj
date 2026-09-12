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
  const ar = language === 'ar';
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
        onPress: () => deleteMutation.mutate(
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
      <View style={[styles.profileCard, { backgroundColor: community.surface, borderColor: community.border }]}>
        <View style={styles.cover}>
          <View style={styles.mountainBack} />
          <View style={styles.mountainFront} />
          <View style={styles.sun} />
        </View>

        <View style={styles.profileBody}>
          <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.surface }]}>
            {teacher.avatar_url ? (
              <Image source={{ uri: teacher.avatar_url }} style={styles.avatarImg} />
            ) : initials ? (
              <Text style={[styles.avatarInitials, { color: '#0B1833' }]}>{initials}</Text>
            ) : (
              <Ionicons name="person" size={38} color="#0B1833" />
            )}
          </View>

          <View style={[styles.identityRow, { flexDirection: row }]}>
            <View style={styles.identityCopy}>
              <Text style={[styles.name, { color: community.text, textAlign: align }]}>{teacher.full_name ?? ''}</Text>
              <Text style={[styles.role, { color: community.textSecondary, textAlign: align }]}>
                {[teacher.subject, levels].filter(Boolean).join('  •  ') || (ar ? 'أستاذ' : 'Teacher')}
              </Text>
              {!!teacher.wilaya && (
                <View style={[styles.locationRow, { flexDirection: row }]}>
                  <Ionicons name="location-outline" size={14} color={community.textMuted} />
                  <Text style={[styles.locationText, { color: community.textMuted }]}>{teacher.wilaya}</Text>
                </View>
              )}
            </View>

            {!isOwnProfile ? (
              <Pressable
                onPress={handleToggleFollow}
                disabled={followMutation.isPending && followMutation.variables?.teacherId === teacherId}
                style={({ pressed }) => [
                  styles.followButton,
                  {
                    backgroundColor: following ? community.surface : '#0B1833',
                    borderColor: following ? community.border : '#0B1833',
                    opacity: pressed ? 0.82 : 1
                  }
                ]}
              >
                <Text style={[styles.followText, { color: following ? community.text : '#FFFFFF' }]}>
                  {following ? copy.follow.following : copy.follow.follow}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.ownBadge, { borderColor: community.border }]}>
                <Ionicons name="checkmark-circle" size={16} color="#C89522" />
                <Text style={[styles.ownBadgeText, { color: community.text }]}>{ar ? 'ملفك' : 'Your profile'}</Text>
              </View>
            )}
          </View>

          {!!teacher.bio && (
            <Text style={[styles.bio, { color: community.textSecondary, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {teacher.bio}
            </Text>
          )}

          <View style={[styles.statsRow, { flexDirection: row }]}> 
            <Stat value={teacher.posts_count} label={copy.profile.posts} community={community} />
            <Stat value={teacher.followers_count} label={copy.profile.followers} community={community} />
            <Stat value={teacher.following_count} label={copy.profile.following} community={community} />
          </View>

          <View style={[styles.tabsRow, { flexDirection: row, borderTopColor: community.divider }]}> 
            <ProfileTab active icon="grid-outline" label={copy.profile.postsTitle} community={community} />
            <ProfileTab icon="bookmark-outline" label={ar ? 'المحفوظات' : 'Saved'} community={community} />
            <ProfileTab icon="information-circle-outline" label={ar ? 'حول' : 'About'} community={community} />
          </View>
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

function Stat({ value, label, community }: { value: number; label: string; community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: community.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: community.textMuted }]}>{label}</Text>
    </View>
  );
}

function ProfileTab({ active = false, icon, label, community }: { active?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <View style={[styles.profileTab, active && styles.profileTabActive]}>
      <Ionicons name={icon} size={18} color={active ? '#C89522' : community.textMuted} />
      <Text style={[styles.profileTabText, { color: active ? community.text : community.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 180 },
  stateIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  errorBody: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  profileCard: { borderBottomWidth: 1, overflow: 'hidden' },
  cover: { height: 132, backgroundColor: '#F3AA88', position: 'relative', overflow: 'hidden' },
  sun: { position: 'absolute', width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD889', right: 34, top: 26 },
  mountainBack: { position: 'absolute', width: 280, height: 180, backgroundColor: '#6179A0', transform: [{ rotate: '18deg' }], left: -25, top: 78 },
  mountainFront: { position: 'absolute', width: 320, height: 190, backgroundColor: '#334F75', transform: [{ rotate: '-12deg' }], right: -60, top: 92 },
  profileBody: { paddingHorizontal: 16, paddingBottom: 0 },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 5, marginTop: -46, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#D9E6F2' },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 27, fontWeight: '900' },
  identityRow: { marginTop: 10, alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  identityCopy: { flex: 1 },
  name: { fontSize: 22, fontWeight: '900' },
  role: { marginTop: 3, fontSize: 12.5, fontWeight: '600' },
  locationRow: { alignItems: 'center', gap: 4, marginTop: 5 },
  locationText: { fontSize: 11.5 },
  followButton: { minHeight: 38, minWidth: 86, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  followText: { fontSize: 12.5, fontWeight: '900' },
  ownBadge: { minHeight: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownBadgeText: { fontSize: 12, fontWeight: '800' },
  bio: { marginTop: 12, fontSize: 13, lineHeight: 20 },
  statsRow: { marginTop: 18, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '900' },
  statLabel: { marginTop: 2, fontSize: 10.5, fontWeight: '700' },
  tabsRow: { borderTopWidth: 1, marginTop: 2 },
  profileTab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 },
  profileTabActive: { borderBottomWidth: 2, borderBottomColor: '#C89522' },
  profileTabText: { fontSize: 10.5, fontWeight: '800' },
  postsList: { gap: 10 },
  emptyPosts: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  emptyPostsText: { fontSize: 13, fontWeight: '600', textAlign: 'center' }
});
