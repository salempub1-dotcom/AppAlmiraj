import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityFeed, useTeacherPublicProfiles } from '../../../hooks/useCommunity';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';

// TeacherSpaceGate renders CommunityFeedList only once a session is
// confirmed - useCommunityFeed/useTeacherPublicProfiles are declared inside
// CommunityFeedList, so they are never mounted (and never query Supabase)
// for a guest or during the initial auth bootstrap.
export function CommunityFeedScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CommunityFeedList navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function CommunityFeedList({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const feed = useCommunityFeed();
  const posts = useMemo<CommunityPost[]>(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const authorIds = useMemo(() => [...new Set(posts.map((post) => post.author_id))], [posts]);
  const authors = useTeacherPublicProfiles(authorIds);
  const authorById = useMemo(() => {
    const map = new Map<string, PublicTeacherProfile>();
    (authors.data ?? []).forEach((profile: PublicTeacherProfile) => map.set(profile.id, profile));
    return map;
  }, [authors.data]);

  const header = (
    <View style={styles.header}>
      <View style={[styles.headerTopRow, { flexDirection: row }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="people" size={22} color="#0B1833" />
        </View>
        <Pressable onPress={() => navigation.navigate('CreateCommunityPost')} style={[styles.addButton, { backgroundColor: colors.primary, flexDirection: row }]}>
          <Ionicons name="add" size={18} color="#0B1833" />
          <Text style={styles.addButtonText}>{copy.feed.newPost}</Text>
        </Pressable>
      </View>
      <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{copy.feed.title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted, textAlign: align }]}>{copy.feed.subtitle}</Text>
    </View>
  );

  if (feed.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>{copy.feed.loading}</Text>
      </Screen>
    );
  }

  if (feed.isError) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={34} color={colors.primary} />
        <Text style={[styles.guestTitle, { color: colors.text }]}>{copy.feed.loadError}</Text>
        <Text style={[styles.guestText, { color: colors.muted }]}>{copy.feed.loadErrorText}</Text>
        <Pressable onPress={() => feed.refetch()} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.signInButtonText}>{copy.feed.retry}</Text>
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
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="chatbubbles-outline" size={30} color={colors.primary} />
            <Text style={[styles.guestTitle, { color: colors.text }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.guestText, { color: colors.muted }]}>{copy.feed.emptyText}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <CommunityPostCard
            post={item}
            author={authorById.get(item.author_id)}
            onPress={() => navigation.navigate('CommunityPostDetail', { postId: item.id })}
            onPressAuthor={() => navigation.navigate('TeacherCommunityProfile', { teacherId: item.author_id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 13 }} />}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 12 }}>{copy.feed.loadingMore}</Text>
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
  header: { gap: 8, marginBottom: 18 },
  headerTopRow: { justifyContent: 'space-between', alignItems: 'center' },
  headerIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  addButton: { borderRadius: 14, minHeight: 42, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', gap: 6 },
  addButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 13 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 12.5 },
  guestTitle: { fontWeight: '900', fontSize: 18 },
  guestText: { lineHeight: 21, fontSize: 13 },
  signInButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15 },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderWidth: 1, borderRadius: 22, padding: 24, gap: 8, alignItems: 'center', marginTop: 10 },
  footerLoading: { paddingVertical: 18, alignItems: 'center', gap: 6 }
});
