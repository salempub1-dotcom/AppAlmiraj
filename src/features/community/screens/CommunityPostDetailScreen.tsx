import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityPostDetail, useTeacherPublicProfile } from '../../../hooks/useCommunity';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { communityTypeIcons } from '../contentTypeIcons';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';

// Gated the same way as the feed: useCommunityPostDetail/useTeacherPublicProfile
// only run once a session is confirmed (see TeacherSpaceGate). There is no
// in-app path that reaches this screen as a guest today, but this keeps the
// guarantee true even if a future deep link or Phase D change adds one.
export function CommunityPostDetailScreen({ route, navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CommunityPostDetailContent route={route} navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function CommunityPostDetailContent({ route, navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const postId = String(route.params?.postId ?? '');

  const detail = useCommunityPostDetail(postId);
  const author = useTeacherPublicProfile(detail.data?.author_id ?? '');

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

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}18`, flexDirection: row, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Ionicons name={communityTypeIcons[post.type]} size={16} color={colors.primary} />
          <Text style={[styles.typeText, { color: colors.primary }]}>{copy.types[post.type]}</Text>
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
        <InteractionStat icon="heart-outline" value={post.likes_count} label={copy.card.likes} />
        <InteractionStat icon="chatbubble-outline" value={post.comments_count} label={copy.card.comments} />
        <InteractionStat icon="bookmark-outline" value={post.saves_count} label={copy.card.saves} />
      </View>
      <Text style={[styles.interactionsHint, { color: colors.muted, textAlign: 'center' }]}>{copy.detail.interactionsSoon}</Text>
    </Screen>
  );
}

function InteractionStat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.interactionStat, { opacity: 0.55 }]}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Text style={[styles.interactionValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.interactionLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  hero: { borderWidth: 1, borderRadius: 26, padding: 20, gap: 11 },
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
  interactionLabel: { fontSize: 11 },
  interactionsHint: { fontSize: 11.5, marginTop: -6 },
  errorTitle: { textAlign: 'center', fontSize: 20, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 21 }
});
