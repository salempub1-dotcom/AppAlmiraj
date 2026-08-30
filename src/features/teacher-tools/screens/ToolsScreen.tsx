import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';

export function ToolsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const align = isRTL ? 'right' as const : 'left' as const;
  const row = isRTL ? 'row-reverse' as const : 'row' as const;
  const tools = [
    { route: 'ClassTimer', icon: 'timer-outline' as const, title: t('tools.timerTitle'), text: t('tools.timerText') },
    { route: 'RandomStudent', icon: 'shuffle-outline' as const, title: t('tools.randomTitle'), text: t('tools.randomText') },
    { route: 'GroupMaker', icon: 'people-outline' as const, title: t('tools.groupsTitle'), text: t('tools.groupsText') }
  ];

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}><Ionicons name="construct" size={21} color="#0B1833" /></View>
        <Text style={[styles.heroTitle, { textAlign: align }]}>{t('tools.heroTitle')}</Text>
        <Text style={[styles.heroBody, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('tools.heroBody')}</Text>
        <View style={[styles.comingBadge, { alignSelf: isRTL ? 'flex-end' : 'flex-start', flexDirection: row }]}><View style={styles.dot} /><Text style={styles.comingText}>{t('tools.ready')}</Text></View>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('tools.sectionTitle')}</Text>
        <Text style={[styles.sectionCaption, { color: colors.muted, textAlign: align }]}>{t('tools.sectionCaption')}</Text>
      </View>

      <View style={styles.list}>
        {tools.map((tool, index) => (
          <Pressable key={tool.route} onPress={() => navigation.navigate(tool.route)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
            <View style={[styles.numberBadge, { backgroundColor: `${colors.primary}14` }]}><Text style={[styles.number, { color: colors.primary }]}>{index + 1}</Text></View>
            <View style={styles.copy}>
              <View style={[styles.titleRow, { flexDirection: row }]}>
                <Text style={[styles.cardTitle, { color: colors.text, textAlign: align }]}>{tool.title}</Text>
                <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name={tool.icon} size={21} color={colors.primary} /></View>
              </View>
              <Text style={[styles.cardText, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{tool.text}</Text>
              <View style={[styles.openRow, { flexDirection: row }]}>
                <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={15} color={colors.primary} />
                <Text style={[styles.openText, { color: colors.primary }]}>{t('common.openTool')}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.offlineCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
        <View style={[styles.offlineIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="cloud-offline-outline" size={22} color={colors.primary} /></View>
        <View style={styles.copy}>
          <Text style={[styles.offlineTitle, { color: colors.text, textAlign: align }]}>{t('tools.offlineTitle')}</Text>
          <Text style={[styles.offlineText, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('tools.offlineText')}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 }, hero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 23, gap: 11 }, heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' }, heroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 40, fontWeight: '900' }, heroBody: { color: '#C6D0DE', lineHeight: 23 }, comingBadge: { gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, marginTop: 3 }, dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#D4AF37' }, comingText: { color: '#E3E9F2', fontSize: 11.5, fontWeight: '800' },
  sectionTitle: { fontSize: 23, fontWeight: '900' }, sectionCaption: { marginTop: 4, fontSize: 12, lineHeight: 19 }, list: { gap: 11 }, card: { borderWidth: 1, borderRadius: 22, padding: 16, alignItems: 'center', gap: 12 }, numberBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, number: { fontWeight: '900' }, copy: { flex: 1, gap: 6 }, titleRow: { justifyContent: 'space-between', alignItems: 'center', gap: 8 }, icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardTitle: { flex: 1, fontSize: 16, fontWeight: '900' }, cardText: { fontSize: 12.5, lineHeight: 20 }, openRow: { alignItems: 'center', gap: 5, marginTop: 2 }, openText: { fontSize: 12, fontWeight: '900' }, offlineCard: { borderWidth: 1, borderRadius: 22, padding: 16, alignItems: 'flex-start', gap: 12 }, offlineIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, offlineTitle: { fontWeight: '900' }, offlineText: { lineHeight: 21, fontSize: 12.5 }
});
