import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
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
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { PublicTeacherProfile } from '../../../repositories/communityRepository';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';

// Authenticated-only (gated the same way as every other Teacher Space
// screen - see TeacherSpaceGate), paginated, newest-saved-first. Only the
// current teacher's own saves are ever readable here: community_saves' RLS
// policy restricts SELECT to `user_id = auth.uid()`, so this screen can
// never show or imply another user's saved-post relationships.
export function SavedCommunityPostsScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <SavedCommunityPostsList navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function SavedCommunityPostsList({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);

  const saved = useSavedCommunityPosts();
  const rows = useMemo(() => saved.data?.pages.flat() ?? [], [saved.data]);
  const posts = useMemo(() => rows.map((row) => row.post), [rows]);

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

  const header = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{copy.savedPosts.title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted, textAlign: align }]}>{copy.savedPosts.subtitle}</Text>
    </View>
  );

  if (saved.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>{copy.savedPosts.loading}</Text>
      </Screen>
    );
  }

  if (saved.isError) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={34} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{copy.savedPosts.loadError}</Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>{copy.savedPosts.loadErrorText}</Text>
        <Pressable onPress={() => saved.refetch()} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.retryButtonText}>{copy.savedPosts.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen style={styles.listPage}>
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
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="bookmark-outline" size={30} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{copy.savedPosts.emptyTitle}</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>{copy.savedPosts.emptyText}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const liked = likedIds.data?.has(item.id) ?? false;
          const isSaved = savedIds.data?.has(item.id) ?? false;
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
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 13 }} />}
        ListFooterComponent={
          saved.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12 },
  listPage: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40, gap: 0 },
  header: { gap: 6, marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 12.5 },
  emptyTitle: { fontWeight: '900', fontSize: 18 },
  emptyText: { lineHeight: 21, fontSize: 13, textAlign: 'center' },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  retryButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15 },
  emptyCard: { borderWidth: 1, borderRadius: 22, padding: 24, gap: 8, alignItems: 'center', marginTop: 10 },
  footerLoading: { paddingVertical: 18, alignItems: 'center' }
});
