import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

const tools = [
  { route: 'ClassTimer', icon: 'timer-outline' as const, title: 'مؤقت القسم', text: 'مؤقت واضح للأنشطة، التحديات والعمل الجماعي.' },
  { route: 'RandomStudent', icon: 'shuffle-outline' as const, title: 'اختيار تلميذ عشوائي', text: 'اختيار سريع وعادل أثناء المشاركة داخل القسم.' },
  { route: 'GroupMaker', icon: 'people-outline' as const, title: 'تقسيم المجموعات', text: 'إنشاء مجموعات عشوائية بسرعة وبدون تعقيد.' }
];

export function ToolsScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="construct" size={21} color="#0B1833" />
        </View>
        <Text style={styles.heroTitle}>أدوات الأستاذ</Text>
        <Text style={styles.heroBody}>أدوات صغيرة وسريعة تساعدك أثناء الحصة، وتعمل دون الحاجة إلى اتصال مستمر بالإنترنت.</Text>
        <View style={styles.comingBadge}>
          <View style={styles.dot} />
          <Text style={styles.comingText}>جاهزة للتجربة</Text>
        </View>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>أدوات البداية</Text>
        <Text style={[styles.sectionCaption, { color: colors.muted }]}>ثلاث أدوات عملية للاستخدام المباشر داخل القسم</Text>
      </View>

      <View style={styles.list}>
        {tools.map((tool, index) => (
          <Pressable key={tool.title} onPress={() => navigation.navigate(tool.route)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.numberBadge, { backgroundColor: `${colors.primary}14` }]}> 
              <Text style={[styles.number, { color: colors.primary }]}>{index + 1}</Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{tool.title}</Text>
                <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name={tool.icon} size={21} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.cardText, { color: colors.muted }]}>{tool.text}</Text>
              <View style={styles.openRow}>
                <Ionicons name="arrow-back" size={15} color={colors.primary} />
                <Text style={[styles.openText, { color: colors.primary }]}>فتح الأداة</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.offlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.offlineIcon, { backgroundColor: `${colors.primary}18` }]}> 
          <Ionicons name="cloud-offline-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.offlineTitle, { color: colors.text }]}>مناسبة للاستخدام داخل القسم</Text>
          <Text style={[styles.offlineText, { color: colors.muted }]}>الأدوات الثلاث تعمل محليًا داخل التطبيق ولا تحتاج إلى قاعدة البيانات أثناء الاستخدام.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 },
  hero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 23, gap: 11 },
  heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  heroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 40, fontWeight: '900', textAlign: 'right' },
  heroBody: { color: '#C6D0DE', textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  comingBadge: { alignSelf: 'flex-end', flexDirection: 'row-reverse', gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#D4AF37' },
  comingText: { color: '#E3E9F2', fontSize: 11.5, fontWeight: '800' },
  sectionTitle: { fontSize: 23, fontWeight: '900', textAlign: 'right' },
  sectionCaption: { textAlign: 'right', marginTop: 4, fontSize: 12, lineHeight: 19 },
  list: { gap: 11 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  numberBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  number: { fontWeight: '900' },
  copy: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  cardText: { fontSize: 12.5, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },
  openRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 2 },
  openText: { fontSize: 12, fontWeight: '900' },
  offlineCard: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
  offlineIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  offlineTitle: { textAlign: 'right', fontWeight: '900' },
  offlineText: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 21, fontSize: 12.5 }
});
