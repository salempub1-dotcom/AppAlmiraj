import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useTeacherPublicProfiles } from '../../../hooks/useCommunity';
import {
  useCommunityLike,
  useCommunityLikedIds,
  useCommunitySave,
  useCommunitySavedIds,
  useSavedCommunityPosts
} from '../../../hooks/useCommunityInteractions';
import { useDeleteCommunityPost, useSetOwnCommunityPostVisibility } from '../../../hooks/useCommunityPostOwner';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { getCommunityTheme } from '../communityTheme';

export function SavedCommunityPostsScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <SavedCommunityPostsList navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function SavedCommunityPostsList({ navigation }: any) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const saved = useSavedCommunityPosts();
  const rows = useMemo(() => saved.data?.pages.flat() ?? [], [saved.data]);
  const posts = useMemo(() => rows.map((item) => item.post), [rows]);

  const authorIds = useMemo(() => [...new Set(posts.map((post) => post.author_id))], [posts]);
  const authors = useTeacherPublicProfiles(authorIds);
  const authorById = useMemo(() => {
    const map = new Map<string, PublicTeacherProfile>();
    (authors.data ?? []).forEach((profile: PublicTeacherProfile) => map.set(profile.id, profile));
    return map;
  }, [authors.data]);

  const postIds = useMemo(() => posts.map((post) => post.id), [posts]);
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

  const header = (
    <View style={styles.header}>
      <View style={[styles.headerCard, { backgroundColor: community.primary }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="bookmark" size={22} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { textAlign: align }]}>{copy.savedPosts.title}</Text>
        <Text style={[styles.subtitle, { textAlign: align }]}>{copy.savedPosts.subtitle}</Text>
      </View>
    </View>
  );

  if (saved.isLoading) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <ActivityIndicator color={community.primary} size="large" />
        <Text style={{ color: community.textMuted }}>{copy.savedPosts.loading}</Text>
      </Screen>
    );
  }

  if (saved.isError) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="cloud-offline-outline" size={30} color={community.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: community.text }]}>{copy.savedPosts.loadError}</Text>
        <Text style={[styles.emptyText, { color: community.textSecondary }]}>{copy.savedPosts.loadErrorText}</Text>
        <Pressable onPress={() => saved.refetch()} style={[styles.retryButton, { backgroundColor: community.primary }]}>
          <Text style={styles.retryButtonText}>{copy.savedPosts.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen style={{ ...styles.listPage, backgroundColor: community.background }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (saved.hasNextPage && !saved.isFetchingNextPage) saved.fetchNextPage();
        }}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: community.surface,
                borderColor: community.border,
                shadowColor: community.shadow
              }
            ]}
          >
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
              <Ionicons name="bookmark-outline" size={28} color={community.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: community.text }]}>{copy.savedPosts.emptyTitle}</Text>
            <Text style={[styles.emptyText, { color: community.textSecondary }]}>{copy.savedPosts.emptyText}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const liked = likedIds.data?.has(item.id) ?? false;
          const isSaved = savedIds.data?.has(item.id) ?? false;
          const isOwner = Boolean(viewerId) && viewerId === item.author_id;
          const ownerBusy =
            (visibilityMutation.isPending && visibilityMutation.variables?.postId === item.id) ||
            (deleteMutation.isPending && deleteMutation.variables?.postId === item.id);

          return (
            <CommunityPostCard
              post={item}
              author={authorById.get(item.author_id)}
              onPress={() => navigation.navigate('CommunityPostDetail', { postId: item.id })}
              onPressAuthor={() => navigation.navigate('TeacherCommunityProfile', { teacherId: item.author_id })}
              liked={liked}
              saved={isSaved}
              onToggleLike={() => likeMutation.mutate({ postId: item.id, liked })}
              onToggleSave={() => saveMutation.mutate({ postId: item.id, saved: isSaved })}
              likePending={likeMutation.isPending && likeMutation.variables?.postId === item.id}
              savePending={saveMutation.isPending && saveMutation.variables?.postId === item.id}
              isOwner={isOwner}
              onEdit={() => navigation.navigate('EditCommunityPost', { postId: item.id })}
              onDeletePost={() => handleDeletePost(item)}
              onToggleVisibility={() => handleToggleVisibility(item)}
              ownerBusy={ownerBusy}
              showHiddenBadge={isOwner && item.status === 'hidden'}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={
          saved.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={community.primary} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  listPage: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 40 },
  header: { marginBottom: 14 },
  headerCard: { borderRadius: 22, padding: 18, gap: 5 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7
  },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12.5, lineHeight: 19 },
  stateIcon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontWeight: '900', fontSize: 18, textAlign: 'center' },
  emptyText: { lineHeight: 21, fontSize: 13, textAlign: 'center' },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  retryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    gap: 9,
    alignItems: 'center',
    marginTop: 6,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  footerLoading: { paddingVertical: 18, alignItems: 'center' }
});
