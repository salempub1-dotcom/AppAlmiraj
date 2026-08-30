import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '../../../components/ContentCard';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useLatestContent } from '../../../hooks/useContent';

export function HomeScreen() {
  const { colors } = useTheme();
  const latest = useLatestContent(6);

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>Al Miraj Education</Text>
      <Text style={[styles.title, { color: colors.text }]}>مرحبًا أستاذ 👋</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>كل ما يساعدك في يومك المهني، بدون عرض محتوى منتجات المعراج المدفوعة.</Text>

      <View style={styles.quickGrid}>
        {['فيديوهات تعليمية', 'فروض واختبارات', 'مشاكل وحلول', 'نصائح وأفكار'].map((item) => (
          <View key={item} style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, textAlign: 'right', fontWeight: '700' }}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>جديد المعراج</Text>
      {latest.isLoading && <ActivityIndicator />}
      {latest.isError && <Text style={{ color: colors.muted, textAlign: 'right' }}>تعذر تحميل المحتوى الآن. حاول لاحقًا.</Text>}
      {!latest.isLoading && !latest.isError && latest.data?.length === 0 && (
        <Text style={{ color: colors.muted, textAlign: 'right' }}>سيظهر هنا أحدث المحتوى فور نشره من لوحة الإدارة.</Text>
      )}
      <View style={styles.list}>{latest.data?.map((post) => <ContentCard key={post.id} post={post} />)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  eyebrow: { textAlign: 'right', fontWeight: '800' },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', lineHeight: 23 },
  quickGrid: { gap: 10, marginTop: 6 },
  quickCard: { minHeight: 58, borderWidth: 1, borderRadius: 16, justifyContent: 'center', padding: 14 },
  sectionTitle: { fontSize: 22, fontWeight: '800', textAlign: 'right', marginTop: 12 },
  list: { gap: 12 }
});
