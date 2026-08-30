import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useContentDetail } from '../../../hooks/useContent';
import type { ContentMedia, PostType } from '../../../repositories/contentRepository';

const labels: Record<PostType, string> = {
  video: 'فيديو تعليمي',
  article: 'مقال',
  teacher_tip: 'نصيحة للأستاذ',
  problem: 'مشكلة وحل',
  question: 'سؤال',
  poll: 'استطلاع',
  exam: 'اختبار',
  test: 'فرض',
  resource: 'مورد مجاني',
  announcement: 'مستجد'
};

const icons: Record<PostType, keyof typeof Ionicons.glyphMap> = {
  video: 'play-circle-outline',
  article: 'document-text-outline',
  teacher_tip: 'bulb-outline',
  problem: 'help-buoy-outline',
  question: 'help-circle-outline',
  poll: 'stats-chart-outline',
  exam: 'school-outline',
  test: 'clipboard-outline',
  resource: 'folder-open-outline',
  announcement: 'megaphone-outline'
};

function firstExternalUrl(media: ContentMedia) {
  const candidates = [media.youtube_url, media.video_url, media.file_url];
  return candidates.find((value): value is string => typeof value === 'string' && /^https?:\/\//i.test(value));
}

export function ContentDetailScreen({ route }: any) {
  const { colors } = useTheme();
  const postId = String(route.params?.postId ?? '');
  const detail = useContentDetail(postId);

  if (detail.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>جاري فتح المحتوى...</Text>
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen style={styles.center}>
        <View style={[styles.errorIcon, { backgroundColor: `${colors.primary}18` }]}> 
          <Ionicons name="alert-circle-outline" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.text }]}>تعذر فتح المحتوى</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>قد يكون المحتوى غير متاح أو لم يعد منشورًا.</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.button, { backgroundColor: colors.primary }]}> 
          <Ionicons name="refresh-outline" size={18} color="#17130C" />
          <Text style={styles.buttonText}>إعادة المحاولة</Text>
        </Pressable>
      </Screen>
    );
  }

  const post = detail.data;
  const externalUrl = firstExternalUrl(post.media ?? {});
  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean).join('  •  ');

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.badgesRow}>
          {post.is_official && (
            <View style={[styles.officialBadge, { borderColor: colors.primary }]}> 
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
              <Text style={[styles.officialText, { color: colors.primary }]}>محتوى رسمي من المعراج</Text>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}18` }]}> 
            <Ionicons name={icons[post.post_type]} size={16} color={colors.primary} />
            <Text style={[styles.type, { color: colors.primary }]}>{labels[post.post_type]}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
        {!!meta && <Text style={[styles.meta, { color: colors.muted }]}>{meta}</Text>}
      </View>

      {!!post.body && (
        <View style={[styles.bodyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.cardHeadingRow}>
            <Ionicons name="reader-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardHeading, { color: colors.text }]}>التفاصيل</Text>
          </View>
          <Text style={[styles.body, { color: colors.text }]}>{post.body}</Text>
        </View>
      )}

      {externalUrl && (
        <Pressable
          onPress={() => Linking.openURL(externalUrl)}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name={post.post_type === 'video' ? 'play' : 'open-outline'} size={19} color="#17130C" />
          <Text style={styles.buttonText}>{post.post_type === 'video' ? 'مشاهدة الفيديو' : 'فتح المورد'}</Text>
        </Pressable>
      )}

      {post.helpful_count > 0 && (
        <View style={[styles.helpfulCard, { backgroundColor: `${colors.primary}0D`, borderColor: colors.border }]}> 
          <Ionicons name="thumbs-up-outline" size={21} color={colors.primary} />
          <Text style={[styles.helpfulText, { color: colors.muted }]}>{post.helpful_count} أستاذ وجدوا هذا المحتوى مفيدًا</Text>
        </View>
      )}

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Ionicons name="lock-closed-outline" size={21} color={colors.primary} />
        <View style={styles.infoCopy}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>عن هذا المحتوى</Text>
          <Text style={[styles.infoBody, { color: colors.muted }]}>هذا القسم مخصص للمحتوى التعليمي المجاني والمساند للأستاذ. محتوى منتجات المعراج المدفوعة لا يتم عرضه كاملًا داخل التطبيق.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  hero: { borderWidth: 1, borderRadius: 26, padding: 20, gap: 13 },
  badgesRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  typeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  type: { fontWeight: '900', fontSize: 12 },
  officialBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  officialText: { fontSize: 11.5, fontWeight: '900' },
  title: { fontSize: 30, lineHeight: 43, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  meta: { textAlign: 'right', writingDirection: 'ltr', lineHeight: 21, fontSize: 13 },
  bodyCard: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 13 },
  cardHeadingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, alignSelf: 'flex-end' },
  cardHeading: { textAlign: 'right', fontWeight: '900', fontSize: 17 },
  body: { textAlign: 'right', writingDirection: 'rtl', fontSize: 17, lineHeight: 31 },
  button: { minHeight: 56, borderRadius: 17, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonText: { color: '#17130C', fontWeight: '900', fontSize: 16 },
  helpfulCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row-reverse', gap: 9, alignItems: 'center' },
  helpfulText: { flex: 1, textAlign: 'right', writingDirection: 'rtl', lineHeight: 21 },
  infoCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 11, flexDirection: 'row-reverse', alignItems: 'flex-start' },
  infoCopy: { flex: 1, gap: 5 },
  infoTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16 },
  infoBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  errorIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { textAlign: 'center', fontSize: 22, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 23 }
});
