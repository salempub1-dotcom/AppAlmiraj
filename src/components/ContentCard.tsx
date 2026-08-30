import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

const icons: Record<ContentPost['post_type'], keyof typeof Ionicons.glyphMap> = {
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

export function ContentCard({ post }: { post: ContentPost }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean).join('  •  ');

  return (
    <Pressable
      onPress={() => navigation.navigate('ContentDetail', { postId: post.id })}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.992 : 1 }]
        }
      ]}
    >
      <View style={styles.topRow}>
        {post.is_official ? (
          <View style={[styles.officialBadge, { borderColor: colors.primary }]}> 
            <Ionicons name="shield-checkmark-outline" size={13} color={colors.primary} />
            <Text style={[styles.official, { color: colors.primary }]}>المعراج</Text>
          </View>
        ) : (
          <View />
        )}

        <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}18` }]}> 
          <Ionicons name={icons[post.post_type]} size={15} color={colors.primary} />
          <Text style={[styles.badge, { color: colors.primary }]}>{labels[post.post_type]}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

      {!!post.body && (
        <Text numberOfLines={3} style={[styles.body, { color: colors.muted }]}>
          {post.body}
        </Text>
      )}

      {!!meta && <Text style={[styles.meta, { color: colors.muted }]}>{meta}</Text>}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={styles.helpfulRow}>
          {post.helpful_count > 0 && <Ionicons name="thumbs-up-outline" size={14} color={colors.muted} />}
          {post.helpful_count > 0 && (
            <Text style={[styles.helpful, { color: colors.muted }]}>{post.helpful_count} وجدوه مفيدًا</Text>
          )}
        </View>
        <View style={styles.openRow}>
          <Ionicons name="chevron-back" size={15} color={colors.primary} />
          <Text style={[styles.open, { color: colors.primary }]}>عرض التفاصيل</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  officialBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  official: { fontWeight: '900', fontSize: 11 },
  typeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badge: { fontWeight: '800', fontSize: 12 },
  title: { fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', fontSize: 19, lineHeight: 30 },
  body: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 25, fontSize: 14.5 },
  meta: { textAlign: 'right', writingDirection: 'ltr', fontSize: 12.5, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helpfulRow: { flexDirection: 'row', gap: 5, alignItems: 'center', flex: 1 },
  helpful: { fontSize: 11.5 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  open: { fontWeight: '900', fontSize: 12 }
});
