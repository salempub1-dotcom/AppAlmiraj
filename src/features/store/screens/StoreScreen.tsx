import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

const features = [
  { icon: 'grid-outline' as const, title: 'منتجات المعراج', text: 'نفس المنتجات الموجودة في المتجر الحالي، بدون قاعدة بيانات ثانية.' },
  { icon: 'cart-outline' as const, title: 'طلب سريع', text: 'سلة وطلب بالدفع عند الاستلام مع تجربة بسيطة وواضحة.' },
  { icon: 'cube-outline' as const, title: 'طلباتي', text: 'متابعة حالة الطلبات السابقة من نفس الحساب.' },
  { icon: 'location-outline' as const, title: 'تتبع الطلب', text: 'ربط آمن مع نظام التوصيل دون إظهار بيانات داخلية.' }
];

export function StoreScreen() {
  const { colors } = useTheme();

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="bag-handle" size={18} color="#0B1833" />
        </View>
        <Text style={styles.heroTitle}>متجر المعراج</Text>
        <Text style={styles.heroBody}>تجربة شراء مباشرة من التطبيق، بنفس منتجات وطلبات متجر المعراج.</Text>
        <View style={styles.comingBadge}>
          <View style={styles.dot} />
          <Text style={styles.comingText}>قيد التجهيز للمرحلة الثالثة</Text>
        </View>
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ما الذي سيقدمه المتجر؟</Text>
        <Text style={[styles.sectionCaption, { color: colors.muted }]}>تجربة شراء موحدة بين الموقع والتطبيق</Text>
      </View>

      <View style={styles.grid}>
        {features.map((feature) => (
          <View key={feature.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name={feature.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{feature.title}</Text>
            <Text style={[styles.cardText, { color: colors.muted }]}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
        <View style={styles.noteCopy}>
          <Text style={[styles.noteTitle, { color: colors.text }]}>نفس النظام، بدون تكرار</Text>
          <Text style={[styles.noteText, { color: colors.muted }]}>سنستخدم نفس المنتجات والطلبات والبنية الحالية، مع تمييز الطلبات القادمة من التطبيق فقط للتحليل.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 },
  hero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 23, gap: 11 },
  heroBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  heroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 40, fontWeight: '900', textAlign: 'right' },
  heroBody: { color: '#C6D0DE', textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  comingBadge: { alignSelf: 'flex-end', flexDirection: 'row-reverse', gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#D4AF37' },
  comingText: { color: '#E3E9F2', fontSize: 11.5, fontWeight: '800' },
  sectionTitle: { fontSize: 23, fontWeight: '900', textAlign: 'right' },
  sectionCaption: { textAlign: 'right', marginTop: 4, fontSize: 12 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  card: { width: '48.4%', minHeight: 160, borderWidth: 1, borderRadius: 22, padding: 16, gap: 8 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  cardTitle: { fontSize: 15.5, fontWeight: '900', textAlign: 'right' },
  cardText: { fontSize: 11.8, lineHeight: 19, textAlign: 'right', writingDirection: 'rtl' },
  note: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row-reverse', gap: 12, alignItems: 'flex-start' },
  noteCopy: { flex: 1, gap: 5 },
  noteTitle: { textAlign: 'right', fontWeight: '900' },
  noteText: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 21, fontSize: 12.5 }
});
