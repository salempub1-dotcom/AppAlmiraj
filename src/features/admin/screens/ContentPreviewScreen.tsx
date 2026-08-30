import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getAdminCopy } from '../../../i18n/adminCopy';
import { useAdminContentDetail } from '../../../hooks/useAdminContent';
import type { ContentPost } from '../../../repositories/contentRepository';
import { contentTypeIcons } from '../contentTypeIcons';

export function ContentPreviewScreen({ route }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getAdminCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);

  const draft: ContentPost | undefined = route.params?.draft;
  const id: string | undefined = route.params?.id;
  const detail = useAdminContentDetail(draft ? '' : id ?? '');
  const post = (draft ?? detail.data) as ContentPost | undefined;

  if (!draft && detail.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!post) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="alert-circle-outline" size={30} color={colors.muted} />
        <Text style={{ color: colors.text, fontWeight: '800' }}>{copy.form.loadError}</Text>
      </Screen>
    );
  }

  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean).join('  •  ');
  const externalUrl = post.media?.youtube_url || post.media?.video_url;

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.sectionLabel, { color: colors.muted, textAlign: align }]}>{copy.preview.title}</Text>

      <Text style={[styles.subLabel, { color: colors.muted, textAlign: align }]}>{copy.preview.cardView}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {!!post.media?.cover_url && <Image source={{ uri: post.media.cover_url }} style={styles.cardCover} resizeMode="cover" />}
        <View style={styles.cardTopRow}>
          <View style={[styles.typeIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name={contentTypeIcons[post.post_type]} size={18} color={colors.primary} />
          </View>
          <View style={styles.badgesRow}>
            {post.is_official && (
              <View style={[styles.officialBadge, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              </View>
            )}
            <Text style={[styles.typeLabel, { color: colors.primary }]}>{copy.types[post.post_type]}</Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: colors.text, textAlign: align }]}>{post.title}</Text>
        {!!post.body && (
          <Text numberOfLines={3} style={[styles.cardBody, { color: colors.muted, textAlign: align }]}>
            {post.body}
          </Text>
        )}
        {!!meta && <Text style={[styles.cardMeta, { color: colors.muted, textAlign: align }]}>{meta}</Text>}
      </View>

      <Text style={[styles.subLabel, { color: colors.muted, textAlign: align, marginTop: 6 }]}>{copy.preview.detailView}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.detailTitle, { color: colors.text, textAlign: align }]}>{post.title}</Text>
        {!!meta && <Text style={[styles.cardMeta, { color: colors.muted, textAlign: align }]}>{meta}</Text>}
        {!!post.body && <Text style={[styles.detailBody, { color: colors.text, textAlign: align }]}>{post.body}</Text>}
        {!!externalUrl && (
          <Pressable
            onPress={() => Linking.openURL(externalUrl)}
            style={[styles.linkButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name={post.post_type === 'video' ? 'play' : 'open-outline'} size={17} color="#0B1833" />
            <Text style={styles.linkButtonText}>{externalUrl}</Text>
          </Pressable>
        )}
        {!!post.media?.file_url && (
          <View style={[styles.fileChip, { borderColor: colors.border }]}>
            <Ionicons name="document-attach-outline" size={16} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.fileChipText, { color: colors.text }]}>
              {post.media.file_name || post.media.file_url}
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700' },
  subLabel: { fontSize: 11.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 10 },
  cardCover: { width: '100%', height: 140, borderRadius: 14, marginBottom: 2 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  officialBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontWeight: '900', fontSize: 12 },
  cardTitle: { fontWeight: '900', fontSize: 18, lineHeight: 26 },
  cardBody: { lineHeight: 21, fontSize: 13.5 },
  cardMeta: { fontSize: 12 },
  detailTitle: { fontWeight: '900', fontSize: 22, lineHeight: 30 },
  detailBody: { fontSize: 15.5, lineHeight: 26 },
  linkButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: 14, paddingHorizontal: 14 },
  linkButtonText: { color: '#0B1833', fontWeight: '900' },
  fileChip: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12 },
  fileChipText: { flex: 1, fontWeight: '700', fontSize: 13 }
});
