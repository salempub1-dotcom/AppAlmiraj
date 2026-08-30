import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  waiting_customer: 'في انتظار العميل',
  cancelled: 'ملغي'
};

export function OrderDetailScreen({ route }: any) {
  const { colors } = useTheme();
  const order = route.params?.order;
  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.icon, { backgroundColor: colors.surface }]}><Ionicons name="receipt-outline" size={24} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.text }]}>{order?.id}</Text>
        <Text style={[styles.status, { color: colors.primary }]}>{statusLabels[order?.status] ?? order?.status}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>المنتجات</Text>
        {items.map((item: any, index: number) => (
          <View key={`${item.id}-${index}`} style={styles.row}>
            <Text style={[styles.muted, { color: colors.muted }]}>x{item.quantity ?? 1}</Text>
            <Text style={[styles.itemName, { color: colors.text }]}>{String(item.name ?? '').trim()}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.heading, { color: colors.text }]}>التوصيل</Text>
        <Text style={[styles.line, { color: colors.text }]}>الولاية: {order?.wilaya ?? '-'}</Text>
        <Text style={[styles.line, { color: colors.text }]}>البلدية: {order?.commune ?? '-'}</Text>
        <Text style={[styles.line, { color: colors.text }]}>العنوان: {order?.address ?? '-'}</Text>
        <Text style={[styles.line, { color: colors.text }]}>النوع: {order?.delivery_type === 'office' ? 'مكتب' : 'منزل'}</Text>
        <Text style={[styles.line, { color: colors.text }]}>حالة التوصيل: {order?.delivery_status ?? 'لم يرسل بعد'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.totalRow}><Text style={[styles.muted, { color: colors.muted }]}>سعر التوصيل</Text><Text style={[styles.value, { color: colors.text }]}>{Number(order?.shipping ?? 0) > 0 ? `${Number(order.shipping).toLocaleString('fr-DZ')} دج` : 'يؤكد لاحقًا'}</Text></View>
        <View style={styles.totalRow}><Text style={[styles.heading, { color: colors.text }]}>الإجمالي</Text><Text style={[styles.total, { color: colors.primary }]}>{Number(order?.total ?? 0).toLocaleString('fr-DZ')} دج</Text></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 15 },
  hero: { borderWidth: 1, borderRadius: 24, padding: 20, alignItems: 'flex-end', gap: 8 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 23, fontWeight: '900' },
  status: { fontWeight: '900' },
  card: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 10 },
  heading: { fontWeight: '900', fontSize: 17, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemName: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '800' },
  muted: { fontSize: 13 },
  line: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontWeight: '800' },
  total: { fontSize: 20, fontWeight: '900' }
});
