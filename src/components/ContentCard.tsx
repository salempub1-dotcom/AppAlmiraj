import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import type { ContentPost } from '../repositories/contentRepository';

const labels: Record<ContentPost['post_type'], string> = {
  video: 'فيديو',
  article: 'مقال',
  teacher_tip: 'نصيحة',
  question: 'سؤال',
  poll: 'استطلاع',
  exam: 'اختبار',
  test: 'فرض',
  resource: 'مورد',
  announcement: 'مستجد'
};

export function ContentCard({ post }: { post: ContentPost }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.badge, { color: colors.primary }]}>{labels[post.post_type]}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
      {!!post.body && <Text numberOfLines={3} style={[styles.body, { color: colors.muted }]}>{post.body}</Text>}
      {(post.subject || post.level) && <Text style={[styles.meta, { color: colors.muted }]}>{[post.subject, post.level].filter(Boolean).join(' • ')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  badge: { fontWeight: '800', textAlign: 'right', fontSize: 13 },
  title: { fontWeight: '800', textAlign: 'right', fontSize: 18 },
  body: { textAlign: 'right', lineHeight: 22 },
  meta: { textAlign: 'right', fontSize: 12, marginTop: 4 }
});
