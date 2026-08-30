import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '../../../components/ContentCard';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useLatestContent } from '../../../hooks/useContent';

const quickItems = [
  { title: 'فيديوهات تعليمية', subtitle: 'شرح وأفكار للقسم', icon: 'play-circle-outline' as const },
  { title: 'فروض واختبارات', subtitle: 'موارد مجانية منظمة', icon: 'documents-outline' as const },
  { title: 'مشاكل وحلول', subtitle: 'حلول لمواقف يومية', icon: 'help-buoy-outline' as const },
  { title: 'نصائح وأفكار', subtitle: 'اقتراحات عملية للأستاذ', icon: 'bulb-outline' as const }
];

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const latest = useLatestContent(6);

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: `${colors.primary}18` }]}> 
            <Ionicons name="school-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>AL MIRAJ EDUCATION</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>مرحبًا أستاذ</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>منصة يومية تساعدك في التحضير، إدارة القسم والوصول السريع إلى الموارد المفيدة.</Text>

        <Pressable
          onPress={() => navigation.navigate('Explore')}
          style={({ pressed }) => [
            styles.exploreButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
          ]}
        >
          <Ionicons name="compass-outline" size={20} color="#17130C" />
          <Text style={styles.exploreButtonText}>استكشف المحتوى</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Pressable onPress={() => navigation.navigate('Explore')} style={styles.linkRow}>
          <Ionicons name="chevron-back" size={15} color={colors.primary} />
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
                transform: [{ scale: pressed ? 0.985 : 1 }]
              }
            ]}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${colors.primary}16` }]}> 
              <Ionicons name={item.icon} size={23} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.quickSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Pressable onPress={() => latest.refetch()} style={styles.linkRow}>
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          <Text style={[styles.seeAll, { color: colors.primary }]}>تحديث</Text>
        </Pressable>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>جديد المعراج</Text>
      </View>

      {latest.isLoading && <ActivityIndicator color={colors.primary} />}
      {latest.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="cloud-offline-outline" size={28} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل المحتوى</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>تحقق من الاتصال ثم اضغط تحديث.</Text>
        </View>
      )}
      {!latest.isLoading && !latest.isError && latest.data?.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>المحتوى قيد التجهيز</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>سيظهر هنا أحدث المحتوى المجاني فور نشره من المعراج.</Text>
        </View>
      )}
      <View style={styles.list}>{latest.data?.map((post) => <ContentCard key={post.id} post={post} />)}</View>

      <View style={[styles.protectionCard, { backgroundColor: `${colors.primary}0D`, borderColor: colors.border }]}> 
        <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
        <View style={styles.protectionCopy}>
          <Text style={[styles.protectionTitle, { color: colors.text }]}>محتوى المعراج المدفوع محمي</Text>
          <Text style={[styles.protectionBody, { color: colors.muted }]}>التطبيق يقدم موارد مساندة مجانية، بينما تبقى ملفات ومنتجات المعراج المدفوعة متاحة فقط عبر الشراء.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20 },
  hero: { borderWidth: 1, borderRadius: 28, padding: 22, gap: 12 },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  brandMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { textAlign: 'right', fontWeight: '900', fontSize: 12, letterSpacing: 0.9 },
  title: { fontSize: 34, lineHeight: 45, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 25, fontSize: 15 },
  exploreButton: { minHeight: 54, borderRadius: 17, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  exploreButtonText: { color: '#17130C', fontWeight: '900', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 24, fontWeight: '900', textAlign: 'right' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 5 },
  seeAll: { fontWeight: '800', fontSize: 13 },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '48%', minHeight: 132, borderWidth: 1, borderRadius: 22, justifyContent: 'center', padding: 15, gap: 7 },
  quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 2 },
  quickTitle: { textAlign: 'right', writingDirection: 'rtl', fontWeight: '900', fontSize: 16 },
  quickSubtitle: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 19, fontSize: 12 },
  list: { gap: 13 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 7, alignItems: 'flex-end' },
  stateTitle: { textAlign: 'right', fontWeight: '900', fontSize: 17 },
  stateBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  protectionCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12, flexDirection: 'row-reverse', alignItems: 'flex-start' },
  protectionCopy: { flex: 1, gap: 5 },
  protectionTitle: { textAlign: 'right', fontWeight: '900' },
  protectionBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 22, fontSize: 13 }
});
