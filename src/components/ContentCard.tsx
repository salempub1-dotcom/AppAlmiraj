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
  video: 'play',
  article: 'document-text',
  teacher_tip: 'bulb',
  problem: 'sparkles',
  question: 'help-circle',
  poll: 'stats-chart',
  exam: 'school',
  test: 'clipboard',
  resource: 'folder-open',
  announcement: 'megaphone'
};

export function ContentCard({ post }: { post: ContentPost }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean) as string[];

  return (
    <Pressable
      onPress={() => navigation.navigate('ContentDetail', { postId: post.id })}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.94 : 1
        }
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.typeIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name={icons[post.post_type]} size={18} color={colors.primary} />
        </View>

        <View style={styles.badgesRow}>
          {post.is_official && (
            <View style={[styles.officialBadge, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              <Text style={[styles.official, { color: colors.primary }]}>المعراج</Text>
            </View>
          )}
          <Text style={[styles.typeLabel, { color: colors.primary }]}>{labels[post.post_type]}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>

      {!!post.body && (
        <Text numberOfLines={3} style={[styles.body, { color: colors.muted }]}>
          {post.body}
        </Text>
      )}

      {meta.length > 0 && (
        <View style={styles.metaWrap}>
          {meta.map((item) => (
            <View key={item} style={[styles.metaChip, { backgroundColor: `${colors.muted}10`, borderColor: colors.border }]}> 
              <Text style={[styles.metaText, { color: colors.muted }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={styles.helpfulRow}>
          <Ionicons name="thumbs-up-outline" size={14} color={colors.muted} />
          <Text style={[styles.helpful, { color: colors.muted }]}>مفيد لـ {post.helpful_count || 0}</Text>
        </View>
        <View style={styles.openRow}>
          <Text style={[styles.open, { color: colors.primary }]}>عرض التفاصيل</Text>
          <Ionicons name="arrow-back" size={15} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 24, padding: 17, gap: 11 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgesRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  officialBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  official: { fontWeight: '900', fontSize: 10.5 },
  typeLabel: { fontWeight: '900', fontSize: 12.5 },
  title: { fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', fontSize: 19, lineHeight: 30 },
  body: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 25, fontSize: 14.5 },
  metaWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  metaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  metaText: { fontSize: 11.5, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helpfulRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  helpful: { fontSize: 11.5, fontWeight: '700' },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  open: { fontWeight: '900', fontSize: 12.5 }
});
