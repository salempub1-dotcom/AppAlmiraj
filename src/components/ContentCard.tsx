import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeProvider';
import type { ContentPost } from '../repositories/contentRepository';

const labels: Record<ContentPost['post_type'], string> = {
  video: 'فيديو',
  article: 'مقال',
  teacher_tip: 'نصيحة',
  problem: 'مشكلة وحل',
  question: 'سؤال',
  poll: 'استطلاع',
  exam: 'اختبار',
  test: 'فرض',
  resource: 'مورد',
  announcement: 'مستجد'
};

export function ContentCard({ post }: { post: ContentPost }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean).join(' • ');

  return (
    <Pressable
      onPress={() => navigation.navigate('ContentDetail', { postId: post.id })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 }
      ]}
    >
      <View style={styles.topRow}>
        {post.is_official ? (
          <Text style={[styles.official, { color: colors.primary }]}>المعراج</Text>
        ) : (
          <View />
        )}
        <Text style={[styles.badge, { color: colors.primary }]}>{labels[post.post_type]}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

      {!!post.body && (
        <Text numberOfLines={3} style={[styles.body, { color: colors.muted }]}>
          {post.body}
        </Text>
      )}

      {!!meta && <Text style={[styles.meta, { color: colors.muted }]}>{meta}</Text>}

      <View style={styles.footer}>
        {post.helpful_count > 0 ? (
          <Text style={[styles.helpful, { color: colors.muted }]}>
            {post.helpful_count} أستاذ وجدوا هذا المحتوى مفيدًا
          </Text>
        ) : (
          <View />
        )}
        <Text style={[styles.open, { color: colors.primary }]}>عرض التفاصيل</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  official: { fontWeight: '900', fontSize: 12 },
  badge: { fontWeight: '800', textAlign: 'right', fontSize: 13 },
  title: { fontWeight: '800', textAlign: 'right', fontSize: 18 },
  body: { textAlign: 'right', lineHeight: 22 },
  meta: { textAlign: 'right', fontSize: 12, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  helpful: { textAlign: 'right', fontSize: 12, flex: 1 },
  open: { fontWeight: '900', fontSize: 12 }
});
