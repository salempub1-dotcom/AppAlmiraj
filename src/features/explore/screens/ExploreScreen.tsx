import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

const sections = [
  { title: 'فيديوهات تعليمية', description: 'أفكار شرح، إدارة القسم، Listening وWarm-up.' },
  { title: 'فروض واختبارات', description: 'موارد مجانية منظمة حسب المستوى والفصل.' },
  { title: 'مشكلتي اليوم', description: 'مشاكل واقعية يواجهها الأستاذ مع حلول عملية.' },
  { title: 'نصائح وتجارب', description: 'اقتراحات قصيرة ومفيدة من المعراج والأساتذة لاحقًا.' },
  { title: 'المستجدات', description: 'جديد المعراج وما يهم الأستاذ.' }
];

export function ExploreScreen() {
  const { colors } = useTheme();
  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>استكشف</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>اختر ما تحتاجه بدل تصفح Feed عشوائي.</Text>
      <View style={styles.list}>
        {sections.map((section) => (
          <View key={section.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.cardBody, { color: colors.muted }]}>{section.description}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right' },
  list: { gap: 12, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 7 },
  cardTitle: { fontSize: 19, fontWeight: '800', textAlign: 'right' },
  cardBody: { lineHeight: 22, textAlign: 'right' }
});
