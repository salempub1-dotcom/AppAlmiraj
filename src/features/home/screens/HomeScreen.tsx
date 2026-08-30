import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '../../../components/ContentCard';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useLatestContent } from '../../../hooks/useContent';

export function HomeScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<any>();
  const latest = useLatestContent(6);
  const align = isRTL ? 'right' as const : 'left' as const;
  const row = isRTL ? 'row-reverse' as const : 'row' as const;
  const quickItems = [
    { title: t('home.videos'), subtitle: t('home.videosSub'), icon: 'play-circle-outline' as const },
    { title: t('home.tests'), subtitle: t('home.testsSub'), icon: 'documents-outline' as const },
    { title: t('home.problems'), subtitle: t('home.problemsSub'), icon: 'sparkles-outline' as const },
    { title: t('home.tips'), subtitle: t('home.tipsSub'), icon: 'bulb-outline' as const }
  ];

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.topBar, { flexDirection: row }]}>
        <View style={[styles.brandLockup, { flexDirection: row }]}>
          <View style={styles.logoMark}><Ionicons name="school" size={20} color="#0B1833" /></View>
          <View>
            <Text style={[styles.brandName, { color: colors.text, textAlign: align }]}>{t('home.brand')}</Text>
            <Text style={[styles.brandSub, { color: colors.muted, textAlign: align }]}>Al Miraj Education</Text>
          </View>
        </View>
        <View style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="notifications-outline" size={21} color={colors.text} /></View>
      </View>

      <View style={styles.hero}>
        <View style={[styles.heroTopRow, { flexDirection: row }]}>
          <View style={[styles.heroBadge, { flexDirection: row }]}><View style={styles.heroBadgeDot} /><Text style={styles.heroBadgeText}>{t('home.daily')}</Text></View>
          <Ionicons name="sparkles" size={22} color="#D4AF37" />
        </View>
        <Text style={[styles.heroTitle, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('home.heroTitle')}</Text>
        <Text style={[styles.heroBody, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('home.heroBody')}</Text>
        <Pressable onPress={() => navigation.navigate('Explore')} style={({ pressed }) => [styles.primaryCta, { opacity: pressed ? 0.9 : 1, flexDirection: row }]}>
          <Ionicons name="compass-outline" size={20} color="#0B1833" /><Text style={styles.primaryCtaText}>{t('home.explore')}</Text>
        </Pressable>
      </View>

      <View style={[styles.sectionHeader, { flexDirection: row }]}>
        <Pressable onPress={() => navigation.navigate('Explore')} style={[styles.linkRow, { flexDirection: row }]}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>{t('home.seeAll')}</Text><Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={15} color={colors.primary} />
        </Pressable>
        <View><Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('home.quickTitle')}</Text><Text style={[styles.sectionCaption, { color: colors.muted, textAlign: align }]}>{t('home.quickCaption')}</Text></View>
      </View>

      <View style={[styles.quickGrid, { flexDirection: row }]}>
        {quickItems.map((item) => (
          <Pressable key={item.title} onPress={() => navigation.navigate('Explore')} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 }]}>
            <View style={[styles.quickIcon, { backgroundColor: `${colors.primary}18`, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}><Ionicons name={item.icon} size={22} color={colors.primary} /></View>
            <Text style={[styles.quickTitle, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{item.title}</Text>
            <Text style={[styles.quickSubtitle, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.sectionHeader, { flexDirection: row }]}>
        <Pressable onPress={() => latest.refetch()} style={[styles.linkRow, { flexDirection: row }]}><Text style={[styles.seeAll, { color: colors.primary }]}>{t('home.refresh')}</Text><Ionicons name="refresh-outline" size={15} color={colors.primary} /></Pressable>
        <View><Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('home.newTitle')}</Text><Text style={[styles.sectionCaption, { color: colors.muted, textAlign: align }]}>{t('home.newCaption')}</Text></View>
      </View>

      {latest.isLoading && <ActivityIndicator color={colors.primary} />}
      {latest.isError && <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}><Ionicons name="cloud-offline-outline" size={28} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text, textAlign: align }]}>{t('home.loadError')}</Text><Text style={[styles.stateBody, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('home.loadErrorText')}</Text></View>}
      {!latest.isLoading && !latest.isError && latest.data?.length === 0 && <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}><Ionicons name="hourglass-outline" size={28} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text, textAlign: align }]}>{t('home.preparing')}</Text><Text style={[styles.stateBody, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('home.preparingText')}</Text></View>}
      <View style={styles.list}>{latest.data?.map((post) => <ContentCard key={post.id} post={post} />)}</View>

      <View style={[styles.trustCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
        <View style={[styles.trustIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="shield-checkmark-outline" size={23} color={colors.primary} /></View>
        <View style={styles.trustCopy}><Text style={[styles.trustTitle, { color: colors.text, textAlign: align }]}>{t('home.trusted')}</Text><Text style={[styles.trustBody, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('home.trustedText')}</Text></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 }, topBar: { justifyContent: 'space-between', alignItems: 'center' }, brandLockup: { alignItems: 'center', gap: 10 }, logoMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' }, brandName: { fontSize: 18, fontWeight: '900' }, brandSub: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 }, iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, hero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 23, gap: 14, overflow: 'hidden' }, heroTopRow: { alignItems: 'center', justifyContent: 'space-between' }, heroBadge: { alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, heroBadgeDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#D4AF37' }, heroBadgeText: { color: '#D7DFEB', fontWeight: '800', fontSize: 11.5 }, heroTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 42, fontWeight: '900' }, heroBody: { color: '#C7D0DE', lineHeight: 24, fontSize: 14.5 }, primaryCta: { minHeight: 54, borderRadius: 17, backgroundColor: '#D4AF37', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 }, primaryCtaText: { color: '#0B1833', fontWeight: '900', fontSize: 16 }, sectionHeader: { justifyContent: 'space-between', alignItems: 'flex-end' }, sectionTitle: { fontSize: 23, fontWeight: '900' }, sectionCaption: { fontSize: 12, marginTop: 3 }, linkRow: { alignItems: 'center', gap: 2, paddingVertical: 5 }, seeAll: { fontWeight: '900', fontSize: 12.5 }, quickGrid: { flexWrap: 'wrap', gap: 10 }, quickCard: { width: '48.4%', minHeight: 146, borderWidth: 1, borderRadius: 22, padding: 16, justifyContent: 'center', gap: 8 }, quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, quickTitle: { fontWeight: '900', fontSize: 15.5 }, quickSubtitle: { lineHeight: 19, fontSize: 11.5 }, list: { gap: 13 }, stateCard: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 7 }, stateTitle: { fontWeight: '900', fontSize: 17 }, stateBody: { lineHeight: 22 }, trustCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 12, alignItems: 'flex-start' }, trustIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, trustCopy: { flex: 1, gap: 5 }, trustTitle: { fontWeight: '900' }, trustBody: { lineHeight: 21, fontSize: 12.5 }
});
