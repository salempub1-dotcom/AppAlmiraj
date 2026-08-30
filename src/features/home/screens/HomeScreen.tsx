import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '../../../components/ContentCard';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useLatestContent } from '../../../hooks/useContent';

const quickItems = [
  { title: 'فيديوهات تعليمية', subtitle: 'شرح وأفكار جاهزة للقسم', icon: 'play-circle-outline' as const },
  { title: 'فروض واختبارات', subtitle: 'موارد مجانية ومنظمة', icon: 'documents-outline' as const },
  { title: 'مشاكل وحلول', subtitle: 'حلول عملية لمواقف يومية', icon: 'sparkles-outline' as const },
  { title: 'نصائح للأستاذ', subtitle: 'أفكار قصيرة قابلة للتطبيق', icon: 'bulb-outline' as const }
];

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const latest = useLatestContent(6);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <View style={styles.logoMark}>
            <Ionicons name="school" size={20} color="#0B1833" />
          </View>
          <View>
            <Text style={[styles.brandName, { color: colors.text }]}>المعراج</Text>
            <Text style={[styles.brandSub, { color: colors.muted }]}>Al Miraj Education</Text>
          </View>
        </View>
        <View style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={21} color={colors.text} />
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>منصة الأستاذ اليومية</Text>
          </View>
          <Ionicons name="sparkles" size={22} color="#D4AF37" />
        </View>

        <Text style={styles.heroTitle}>كل ما تحتاجه في يومك المهني، في مكان واحد.</Text>
        <Text style={styles.heroBody}>محتوى عملي، موارد مجانية وأدوات تساعدك على التحضير وإدارة القسم بكفاءة أكبر.</Text>

        <Pressable
          onPress={() => navigation.navigate('Explore')}
          style={({ pressed }) => [styles.primaryCta, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Ionicons name="compass-outline" size={20} color="#0B1833" />
          <Text style={styles.primaryCtaText}>استكشف المحتوى</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Pressable onPress={() => navigation.navigate('Explore')} style={styles.linkRow}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
          <Ionicons name="chevron-back" size={15} color={colors.primary} />
        </Pressable>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>وصول سريع</Text>
          <Text style={[styles.sectionCaption, { color: colors.muted }]}>اختصر الطريق إلى ما تحتاجه</Text>
        </View>
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
                opacity: pressed ? 0.92 : 1
              }
            ]}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.quickTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.quickSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Pressable onPress={() => latest.refetch()} style={styles.linkRow}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>تحديث</Text>
          <Ionicons name="refresh-outline" size={15} color={colors.primary} />
        </Pressable>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>جديد المعراج</Text>
          <Text style={[styles.sectionCaption, { color: colors.muted }]}>أحدث ما نُشر للأساتذة</Text>
        </View>
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

      <View style={[styles.trustCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.trustIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="shield-checkmark-outline" size={23} color={colors.primary} />
        </View>
        <View style={styles.trustCopy}>
          <Text style={[styles.trustTitle, { color: colors.text }]}>منصة تعليمية موثوقة</Text>
          <Text style={[styles.trustBody, { color: colors.muted }]}>المحتوى المجاني هنا منفصل عن منتجات المعراج المدفوعة، لضمان قيمة واضحة وآمنة للأستاذ.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  brandLockup: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  logoMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  brandName: { textAlign: 'right', fontSize: 18, fontWeight: '900' },
  brandSub: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 23, gap: 14, overflow: 'hidden' },
  heroTopRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#D4AF37' },
  heroBadgeText: { color: '#D7DFEB', fontWeight: '800', fontSize: 11.5 },
  heroTitle: { color: '#FFFFFF', textAlign: 'right', writingDirection: 'rtl', fontSize: 29, lineHeight: 42, fontWeight: '900' },
  heroBody: { color: '#C7D0DE', textAlign: 'right', writingDirection: 'rtl', lineHeight: 24, fontSize: 14.5 },
  primaryCta: { minHeight: 54, borderRadius: 17, backgroundColor: '#D4AF37', flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  primaryCtaText: { color: '#0B1833', fontWeight: '900', fontSize: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontSize: 23, fontWeight: '900', textAlign: 'right' },
  sectionCaption: { fontSize: 12, marginTop: 3, textAlign: 'right' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 5 },
  seeAll: { fontWeight: '900', fontSize: 12.5 },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '48.4%', minHeight: 146, borderWidth: 1, borderRadius: 22, padding: 16, justifyContent: 'center', gap: 8 },
  quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  quickTitle: { textAlign: 'right', writingDirection: 'rtl', fontWeight: '900', fontSize: 15.5 },
  quickSubtitle: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 19, fontSize: 11.5 },
  list: { gap: 13 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 7, alignItems: 'flex-end' },
  stateTitle: { textAlign: 'right', fontWeight: '900', fontSize: 17 },
  stateBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  trustCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 12, flexDirection: 'row-reverse', alignItems: 'flex-start' },
  trustIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trustCopy: { flex: 1, gap: 5 },
  trustTitle: { textAlign: 'right', fontWeight: '900' },
  trustBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 21, fontSize: 12.5 }
});
