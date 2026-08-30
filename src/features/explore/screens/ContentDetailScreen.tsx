import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useContentDetail } from '../../../hooks/useContent';
import type { PostType } from '../../../repositories/contentRepository';

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

function firstExternalUrl(media: Record<string, unknown>) {
  const candidates = [media.youtube_url, media.video_url, media.file_url, media.url];
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
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen style={styles.center}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>تعذر فتح المحتوى</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>قد يكون المحتوى غير متاح أو لم يعد منشورًا.</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonText}>إعادة المحاولة</Text>
        </Pressable>
      </Screen>
    );
  }

  const post = detail.data;
  const externalUrl = firstExternalUrl(post.media ?? {});
  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean).join(' • ');

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.badgesRow}>
        {post.is_official && (
          <View style={[styles.officialBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.officialText}>محتوى رسمي من المعراج</Text>
          </View>
        )}
        <Text style={[styles.type, { color: colors.primary }]}>{labels[post.post_type]}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
      {!!meta && <Text style={[styles.meta, { color: colors.muted }]}>{meta}</Text>}

      {!!post.body && (
        <View style={[styles.bodyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.text }]}>{post.body}</Text>
        </View>
      )}

      {externalUrl && (
        <Pressable
          onPress={() => Linking.openURL(externalUrl)}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>
            {post.post_type === 'video' ? 'مشاهدة الفيديو' : 'فتح المورد'}
          </Text>
        </Pressable>
      )}

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>عن هذا المحتوى</Text>
        <Text style={[styles.infoBody, { color: colors.muted }]}>
          هذا القسم مخصص للمحتوى التعليمي المجاني والمساند للأستاذ. محتوى منتجات المعراج المدفوعة لا يتم عرضه كاملًا داخل التطبيق.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, justifyContent: 'center', gap: 14 },
  badgesRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  type: { fontWeight: '900', textAlign: 'right' },
  officialBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  officialText: { color: '#17130C', fontSize: 12, fontWeight: '900' },
  title: { fontSize: 30, lineHeight: 40, fontWeight: '900', textAlign: 'right' },
  meta: { textAlign: 'right', lineHeight: 21 },
  bodyCard: { borderWidth: 1, borderRadius: 20, padding: 18 },
  body: { textAlign: 'right', fontSize: 17, lineHeight: 30 },
  button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonText: { color: '#17130C', fontWeight: '900', fontSize: 16 },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 7 },
  infoTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16 },
  infoBody: { textAlign: 'right', lineHeight: 23 },
  errorTitle: { textAlign: 'center', fontSize: 22, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 23 }
});
