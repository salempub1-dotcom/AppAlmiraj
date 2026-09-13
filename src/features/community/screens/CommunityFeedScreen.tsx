import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityFeed, useTeacherPublicProfiles } from '../../../hooks/useCommunity';
import {
  useCommunityLike,
  useCommunityLikedIds,
  useCommunitySave,
  useCommunitySavedIds
} from '../../../hooks/useCommunityInteractions';
import { useDeleteCommunityPost, useSetOwnCommunityPostVisibility } from '../../../hooks/useCommunityPostOwner';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { getCommunityTheme } from '../communityTheme';
import { getCommunitySocialCopy } from '../communitySocialCopy';

type FeedFilter = 'all' | 'idea' | 'question' | 'test' | 'exam' | 'resource' | 'classroom_experience' | 'tip';

const DISPLAY_FILTERS: FeedFilter[] = ['tip', 'classroom_experience', 'resource', 'test', 'exam'];
const FILTER_ICONS: Record<FeedFilter, keyof typeof Ionicons.glyphMap> = {
  all: 'apps-outline',
  idea: 'bulb-outline',
  question: 'help-circle-outline',
  test: 'document-text-outline',
  exam: 'school-outline',
  resource: 'folder-outline',
  classroom_experience: 'people-outline',
  tip: 'bulb-outline'
};

export function CommunityFeedScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CommunityFeedList navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function CommunityFeedList({ navigation }: any) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const social = getCommunitySocialCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const feed = useCommunityFeed();
  const posts = useMemo<CommunityPost[]>(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const visiblePosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'resource') return posts.filter((post) => post.type === 'resource' || post.type === 'pdf');
    return posts.filter((post) => post.type === activeFilter);
  }, [activeFilter, posts]);

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

  const openComposer = () => navigation.navigate('CreateCommunityPost');
  const headerSideCopy = language === 'ar'
    ? { left: 'مشاركة\nخبرة..\nتصنع فرقًا', right: 'معًا\nنصنع تعليمًا أفضل', footer: 'الأفكار تصنع مجتمعات أروع' }
    : { left: 'Share\nExperience\nMake impact', right: 'Together\nWe teach better', footer: 'Ideas build better communities' };

  const header = (
    <View style={styles.header}>
      <View style={styles.hero}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <View style={styles.heroGlow} />
        <Ionicons name="book-outline" size={112} color="rgba(255,255,255,0.055)" style={styles.heroBook} />

        <View style={styles.topBar}>
          <View style={styles.sideActionWrap}>
            <Pressable onPress={openComposer} style={styles.headerIcon}>
              <Ionicons name="add" size={27} color="#FFFFFF" />
            </Pressable>
            <Text style={[styles.sideCopy, { textAlign: 'left' }]}>{headerSideCopy.left}</Text>
          </View>

          <View style={styles.brandLockup}>
            <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="school" size={31} color="#E8BE4C" />
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={styles.spaceTitle}>
                {copy.feed.title}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.spaceSubtitle}>{copy.feed.subtitle}</Text>
          </View>

          <View style={styles.sideActionWrap}>
            <Pressable onPress={() => navigation.navigate('SavedCommunityPosts')} style={styles.headerIcon}>
              <Ionicons name="bookmark-outline" size={23} color="#FFFFFF" />
            </Pressable>
            <Text style={[styles.sideCopy, { textAlign: 'right' }]}>{headerSideCopy.right}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={openComposer}
        style={({ pressed }) => [
          styles.composerCard,
          {
            opacity: pressed ? 0.94 : 1,
            shadowColor: community.isDark ? '#000000' : '#8FAED1'
          }
        ]}
      >
        <View style={styles.composerGlowTop} />
        <View style={styles.composerGoldShape} />
        <View style={[styles.composerMainRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
          <View style={styles.composerAvatarOuter}>
            <View style={styles.composerAvatarInner}>
              <Ionicons name="person" size={25} color="#0E2B58" />
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.composerCenter}>
            <View style={styles.composerPromptBox}>
              <Text numberOfLines={2} style={[styles.composerPrompt, { textAlign: align }]}>
                {social.composerPrompt}
              </Text>
            </View>

            <View style={[styles.quickKinds, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.quickKind, styles.quickKindImage]}>
                <Ionicons name="image-outline" size={18} color="#2564C8" />
                <Text style={[styles.quickKindText, { color: '#2564C8' }]}>{language === 'ar' ? 'صورة' : 'Photo'}</Text>
              </View>
              <View style={[styles.quickKind, styles.quickKindQuestion]}>
                <Ionicons name="help-circle-outline" size={18} color="#7447D4" />
                <Text style={[styles.quickKindText, { color: '#7447D4' }]}>{language === 'ar' ? 'سؤال' : 'Question'}</Text>
              </View>
              <View style={[styles.quickKind, styles.quickKindFile]}>
                <Ionicons name="document-text-outline" size={18} color="#966400" />
                <Text style={[styles.quickKindText, { color: '#966400' }]}>{language === 'ar' ? 'ملف' : 'File'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.publishColumn}>
            <View style={styles.publishButtonOuter}>
              <View style={styles.publishButton}>
                <Ionicons name={isRTL ? 'paper-plane' : 'paper-plane-outline'} size={26} color="#FFFFFF" />
              </View>
            </View>
            <Text numberOfLines={2} style={[styles.composerFooterCopy, { textAlign: align }]}>{headerSideCopy.footer}</Text>
            <View style={styles.composerFooterAccent} />
          </View>
        </View>
      </Pressable>

      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {DISPLAY_FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveFilter(active ? 'all' : filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: active ? '#17396A' : '#FFFFFF',
                    borderColor: active ? '#17396A' : '#D7E2F0',
                    opacity: pressed ? 0.82 : 1
                  }
                ]}
              >
                <Ionicons name={FILTER_ICONS[filter]} size={17} color={active ? '#FFFFFF' : '#17396A'} />
                <Text style={[styles.filterText, { color: active ? '#FFFFFF' : '#17396A' }]}>{social.filters[filter]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.feedBackdropTop} />
    </View>
  );

  if (feed.isLoading) {
    return (
      <Screen style={{ ...styles.loadingPage, backgroundColor: '#EAF4FF' }}>
        <FeedSkeleton community={community} />
      </Screen>
    );
  }

  if (feed.isError) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="cloud-offline-outline" size={30} color={community.primary} /></View>
        <Text style={[styles.stateTitle, { color: community.text }]}>{copy.feed.loadError}</Text>
        <Text style={[styles.stateText, { color: community.textSecondary }]}>{copy.feed.loadErrorText}</Text>
        <Pressable onPress={() => feed.refetch()} style={styles.retryButton}><Text style={styles.retryText}>{copy.feed.retry}</Text></Pressable>
      </Screen>
    );
  }

  return (
    <Screen style={{ ...styles.listPage, backgroundColor: community.isDark ? community.background : '#EAF4FF' }}>
      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => feed.refetch()} tintColor={community.primary} />}
        onEndReachedThreshold={0.45}
        onEndReached={() => { if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage(); }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: community.surface, borderColor: '#D8E6F5' }]}> 
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="chatbubbles-outline" size={28} color={community.primaryStrong} /></View>
            <Text style={[styles.stateTitle, { color: community.text, textAlign: 'center' }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.stateText, { color: community.textSecondary, textAlign: 'center' }]}>{copy.feed.emptyText}</Text>
            <Pressable onPress={openComposer} style={styles.emptyCta}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.emptyCtaText}>{copy.feed.newPost}</Text></Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const liked = likedIds.data?.has(item.id) ?? false;
          const saved = savedIds.data?.has(item.id) ?? false;
          const isOwner = Boolean(viewerId) && viewerId === item.author_id;
          const ownerBusy =
            (visibilityMutation.isPending && visibilityMutation.variables?.postId === item.id) ||
            (deleteMutation.isPending && deleteMutation.variables?.postId === item.id);

          return (
            <View style={[styles.postStage, index % 2 === 0 ? styles.postStageA : styles.postStageB]}>
              <View style={styles.postGlowOne} />
              <View style={styles.postGlowTwo} />
              <CommunityPostCard
                post={item}
                author={authorById.get(item.author_id)}
                onPress={() => navigation.navigate('CommunityPostDetail', { postId: item.id })}
                onPressAuthor={() => navigation.navigate('TeacherCommunityProfile', { teacherId: item.author_id })}
                liked={liked}
                saved={saved}
                onToggleLike={() => likeMutation.mutate({ postId: item.id, liked })}
                onToggleSave={() => saveMutation.mutate({ postId: item.id, saved })}
                likePending={likeMutation.isPending && likeMutation.variables?.postId === item.id}
                savePending={saveMutation.isPending && saveMutation.variables?.postId === item.id}
                isOwner={isOwner}
                onEdit={() => navigation.navigate('EditCommunityPost', { postId: item.id })}
                onDeletePost={() => handleDeletePost(item)}
                onToggleVisibility={() => handleToggleVisibility(item)}
                ownerBusy={ownerBusy}
                showHiddenBadge={isOwner && item.status === 'hidden'}
              />
            </View>
          );
        }}
        ListFooterComponent={feed.isFetchingNextPage ? <View style={styles.footerLoading}><ActivityIndicator color={community.primary} /><Text style={{ color: community.textMuted, fontSize: 12 }}>{copy.feed.loadingMore}</Text></View> : <View style={{ height: 28 }} />}
      />
    </Screen>
  );
}

function FeedSkeleton({ community }: { community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.skeletonHero}>
        <View style={styles.skeletonIconDark} />
        <View style={styles.skeletonTitleDark} />
        <View style={styles.skeletonIconDark} />
      </View>
      {[0, 1].map((item) => (
        <View key={item} style={[styles.skeletonPost, { backgroundColor: community.surface, borderColor: community.border }]}> 
          <View style={styles.skeletonAuthor}><View style={[styles.skeletonAvatar, { backgroundColor: community.surfaceRaised }]} /><View style={{ flex: 1, gap: 7 }}><View style={[styles.skeletonLineShort, { backgroundColor: community.surfaceRaised }]} /><View style={[styles.skeletonLineTiny, { backgroundColor: community.surfaceRaised }]} /></View></View>
          <View style={[styles.skeletonLine, { backgroundColor: community.surfaceRaised }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: community.surfaceRaised }]} />
          <View style={[styles.skeletonMedia, { backgroundColor: community.surfaceRaised }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  loadingPage: { flex: 1, padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listPage: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listContent: { paddingBottom: 0 },
  header: { width: '100%', paddingBottom: 0, backgroundColor: '#EAF4FF' },
  hero: { minHeight: 192, backgroundColor: '#0B1833', overflow: 'hidden', paddingTop: 8, paddingBottom: 24 },
  heroOrbA: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(21,76,143,0.45)', top: -128, right: -52 },
  heroOrbB: { position: 'absolute', width: 245, height: 245, borderRadius: 123, backgroundColor: 'rgba(21,67,126,0.28)', left: -96, bottom: -166 },
  heroGlow: { position: 'absolute', width: 150, height: 190, borderRadius: 80, backgroundColor: 'rgba(46,106,188,0.13)', left: '38%', top: -30 },
  heroBook: { position: 'absolute', right: 74, bottom: -18, transform: [{ rotate: '-8deg' }] },
  topBar: { paddingHorizontal: 14, alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: 'row', gap: 8 },
  sideActionWrap: { width: 78, alignItems: 'center', gap: 8 },
  sideCopy: { color: '#E8BE4C', fontSize: 9.5, fontWeight: '800', lineHeight: 14, width: 76 },
  brandLockup: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4, minWidth: 0 },
  titleRow: { alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  spaceTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', letterSpacing: -0.35, maxWidth: '78%' },
  spaceSubtitle: { color: '#D6E0EC', fontSize: 12.5, fontWeight: '700', marginTop: 7, textAlign: 'center' },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  composerCard: { marginHorizontal: 13, marginTop: -31, borderWidth: 1.5, borderColor: '#E3BC4D', borderRadius: 28, minHeight: 168, paddingHorizontal: 14, paddingVertical: 15, backgroundColor: '#FFFDF7', overflow: 'hidden', shadowOpacity: 0.19, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 7 },
  composerGlowTop: { position: 'absolute', top: -38, left: 68, right: 28, height: 98, borderRadius: 50, backgroundColor: 'rgba(232,244,255,0.72)' },
  composerGoldShape: { position: 'absolute', width: 160, height: 82, borderRadius: 82, left: -58, bottom: -40, backgroundColor: 'rgba(244,205,91,0.22)', transform: [{ rotate: '12deg' }] },
  composerMainRow: { flex: 1, alignItems: 'center', gap: 12 },
  composerAvatarOuter: { width: 58, height: 58, borderRadius: 30, borderWidth: 2, borderColor: '#D8E8FB', backgroundColor: '#F7FBFF', alignItems: 'center', justifyContent: 'center' },
  composerAvatarInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F1FD', alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', width: 15, height: 15, borderRadius: 8, backgroundColor: '#7ABD3A', borderWidth: 2, borderColor: '#FFFFFF', right: -1, bottom: 1 },
  composerCenter: { flex: 1, minWidth: 0, gap: 10 },
  composerPromptBox: { minHeight: 68, borderRadius: 23, paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center', backgroundColor: '#F4F8FD', borderWidth: 1, borderColor: '#E2EAF5', shadowColor: '#B4C8DD', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  composerPrompt: { color: '#334C6D', fontSize: 15.5, lineHeight: 23, fontWeight: '800' },
  quickKinds: { gap: 7, flexWrap: 'wrap' },
  quickKind: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, minHeight: 38 },
  quickKindImage: { backgroundColor: '#E8F2FF' },
  quickKindQuestion: { backgroundColor: '#F2ECFF' },
  quickKindFile: { backgroundColor: '#FFF4D9' },
  quickKindText: { fontSize: 11.5, fontWeight: '900' },
  publishColumn: { width: 74, alignItems: 'center', justifyContent: 'center', gap: 5 },
  publishButtonOuter: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: '#E7B837', padding: 4, backgroundColor: '#FFF7DE', alignItems: 'center', justifyContent: 'center' },
  publishButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#17396A', alignItems: 'center', justifyContent: 'center', shadowColor: '#17396A', shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  composerFooterCopy: { color: '#29405F', fontSize: 8.2, lineHeight: 11, fontWeight: '800', width: 72 },
  composerFooterAccent: { width: 34, height: 2, borderRadius: 99, backgroundColor: '#E2AA1E' },
  filtersWrap: { paddingTop: 13, paddingBottom: 9, backgroundColor: '#EAF4FF' },
  filtersContent: { paddingHorizontal: 13, gap: 9 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, minHeight: 39, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, shadowColor: '#8EACCA', shadowOpacity: 0.13, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  filterText: { fontSize: 11.2, fontWeight: '900' },
  feedBackdropTop: { height: 8, backgroundColor: '#E6F2FF' },
  postStage: { position: 'relative', paddingVertical: 1, overflow: 'hidden' },
  postStageA: { backgroundColor: '#EAF4FF' },
  postStageB: { backgroundColor: '#E5F1FF' },
  postGlowOne: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -75, top: -48, backgroundColor: 'rgba(158,200,246,0.18)' },
  postGlowTwo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, left: -80, bottom: -35, backgroundColor: 'rgba(191,219,250,0.24)' },
  stateIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 18 },
  stateText: { lineHeight: 21, fontSize: 13 },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A66' },
  retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  emptyCard: { borderWidth: 1, borderRadius: 22, padding: 25, gap: 9, alignItems: 'center', margin: 16, shadowColor: '#8EACCA', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  emptyCta: { marginTop: 6, minHeight: 42, borderRadius: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1E3A66' },
  emptyCtaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 },
  footerLoading: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  skeletonHero: { height: 192, paddingHorizontal: 14, backgroundColor: '#0B1833', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonTitleDark: { width: 145, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skeletonIconDark: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.10)' },
  skeletonPost: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderRadius: 22, paddingTop: 13, paddingBottom: 15, gap: 11, overflow: 'hidden' },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonLine: { height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineMedium: { width: '66%', height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineShort: { width: 118, height: 11, borderRadius: 6 },
  skeletonLineTiny: { width: 82, height: 8, borderRadius: 5 },
  skeletonMedia: { marginHorizontal: 10, borderRadius: 16, aspectRatio: 1.18, marginTop: 2 }
});