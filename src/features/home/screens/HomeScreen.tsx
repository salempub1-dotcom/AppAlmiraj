import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ContentCard } from '../../../components/ContentCard';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useLatestContent } from '../../../hooks/useContent';

const quickItems = [
  { title: 'فيديوهات تعليمية', subtitle: 'شرح وأفكار للقسم' },
  { title: 'فروض واختبارات', subtitle: 'موارد مجانية منظمة' },
  { title: 'مشاكل وحلول', subtitle: 'حلول لمواقف يومية' },
  { title: 'نصائح وأفكار', subtitle: 'اقتراحات عملية للأستاذ' }
];

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const latest = useLatestContent(6);

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>AL MIRAJ EDUCATION</Text>
        <Text style={[styles.title, { color: colors.text }]}>مرحبًا أستاذ</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>منصة يومية تساعدك في التحضير، إدارة القسم والوصول السريع إلى الموارد المفيدة.</Text>
        <Pressable
          onPress={() => navigation.navigate('Explore')}
          style={[styles.exploreButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.exploreButtonText}>استكشف المحتوى</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Pressable onPress={() => navigation.navigate('Explore')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
        </Pressable>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>وصول سريع</Text>
      </View>

      <View style={styles.quickGrid}>
        {quickItems.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => navigation.navigate('Explore')}
            style={({ pressed }) => [
              styles.quickCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1
              }
            ]}
          >
            <Text style={[styles.quickTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.quickSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Pressable onPress={() => latest.refetch()}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>تحديث</Text>
        </Pressable>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>جديد المعراج</Text>
      </View>

      {latest.isLoading && <ActivityIndicator color={colors.primary} />}
      {latest.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل المحتوى</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>تحقق من الاتصال ثم اضغط تحديث.</Text>
        </View>
      )}
      {!latest.isLoading && !latest.isError && latest.data?.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stateTitle, { color: colors.text }]}>المحتوى قيد التجهيز</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>سيظهر هنا أحدث المحتوى المجاني فور نشره من المعراج.</Text>
        </View>
      )}
      <View style={styles.list}>{latest.data?.map((post) => <ContentCard key={post.id} post={post} />)}</View>

      <View style={[styles.protectionCard, { borderColor: colors.border }]}>
        <Text style={[styles.protectionTitle, { color: colors.text }]}>محتوى المعراج المدفوع محمي</Text>
        <Text style={[styles.protectionBody, { color: colors.muted }]}>التطبيق يقدم موارد مساندة مجانية، بينما تبقى ملفات ومنتجات المعراج المدفوعة متاحة فقط عبر الشراء.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  hero: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 10 },
  eyebrow: { textAlign: 'right', fontWeight: '900', fontSize: 12, letterSpacing: 0.8 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', lineHeight: 24, fontSize: 15 },
  exploreButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  exploreButtonText: { color: '#17130C', fontWeight: '900', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '900', textAlign: 'right' },
  seeAll: { fontWeight: '800', fontSize: 13 },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '48%', minHeight: 104, borderWidth: 1, borderRadius: 18, justifyContent: 'center', padding: 14, gap: 6 },
  quickTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16 },
  quickSubtitle: { textAlign: 'right', lineHeight: 19, fontSize: 12 },
  list: { gap: 12 },
  stateCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6 },
  stateTitle: { textAlign: 'right', fontWeight: '900', fontSize: 17 },
  stateBody: { textAlign: 'right', lineHeight: 22 },
  protectionCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 6, marginTop: 6 },
  protectionTitle: { textAlign: 'right', fontWeight: '900' },
  protectionBody: { textAlign: 'right', lineHeight: 22, fontSize: 13 }
});
