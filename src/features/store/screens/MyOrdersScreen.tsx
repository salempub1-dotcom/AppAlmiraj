import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { orderRepository } from '../../../repositories/orderRepository';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  waiting_customer: 'في انتظار العميل',
  cancelled: 'ملغي'
};

const deliveryLabels: Record<string, string> = {
  in_preparation: 'قيد التحضير',
  in_transit: 'في الطريق',
  shipped: 'في الطريق',
  out_for_delivery: 'خرج للتسليم',
  delivered: 'تم التسليم',
  returned: 'مرتجع',
  delivery_issue: 'مشكلة توصيل',
  delivery_attempt_failed: 'تعذر التسليم',
  unknown: 'قيد التحديث'
};

export function MyOrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    const { data, error: requestError } = await orderRepository.getMine();
    setLoading(false);
    if (requestError) {
      setError(true);
      return;
    }
    setOrders(data ?? []);
  };

  useEffect(() => { if (session) load(); else setLoading(false); }, [session]);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={load} disabled={!session || loading} style={[styles.refresh, { backgroundColor: colors.surface }]}><Ionicons name="refresh-outline" size={18} color={colors.primary} /></Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>طلباتي</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>الطلبات، الأسعار والتتبع في مكان واحد</Text>
        </View>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}><Ionicons name="cube-outline" size={24} color={colors.primary} /></View>
      </View>

      {!session && <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="person-circle-outline" size={36} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text }]}>سجّل الدخول لعرض طلباتك</Text></View>}
      {loading && <ActivityIndicator color={colors.primary} />}
      {error && <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل الطلبات</Text><Pressable onPress={load}><Text style={{ color: colors.primary, fontWeight: '900' }}>إعادة المحاولة</Text></Pressable></View>}
      {!loading && !error && session && orders.length === 0 && <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="receipt-outline" size={36} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text }]}>لا توجد طلبات بعد</Text><Text style={[styles.stateBody, { color: colors.muted }]}>أي طلب تنشئه من التطبيق سيظهر هنا.</Text></View>}

      <View style={styles.list}>
        {orders.map((order) => {
          const delivery = deliveryLabels[order.delivery_status] || null;
          return (
            <Pressable key={order.id} onPress={() => navigation.navigate('OrderDetail', { order })} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.992 : 1 }] }]}> 
              <View style={styles.row}>
                <View style={styles.badges}><View style={[styles.badge, { backgroundColor: colors.surface }]}><Text style={[styles.status, { color: colors.primary }]}>{statusLabels[order.status] ?? order.status}</Text></View>{delivery && <View style={[styles.badge, { backgroundColor: colors.surface }]}><Text style={[styles.status, { color: colors.primary }]}>{delivery}</Text></View>}</View>
                <Text style={[styles.id, { color: colors.text }]}>{order.tracking || order.id}</Text>
              </View>
              <Text style={[styles.meta, { color: colors.muted }]}>{order.wilaya}{order.commune ? ` • ${order.commune}` : ''} • {order.delivery_type === 'office' ? 'مكتب' : 'منزل'}</Text>
              <View style={[styles.priceBox, { backgroundColor: colors.surface }]}>
                <View><Text style={[styles.priceLabel, { color: colors.muted }]}>التوصيل</Text><Text style={[styles.price, { color: colors.text }]}>{Number(order.shipping ?? 0).toLocaleString('fr-DZ')} دج</Text></View>
                <View><Text style={[styles.priceLabel, { color: colors.muted }]}>الإجمالي</Text><Text style={[styles.total, { color: colors.primary }]}>{Number(order.total ?? 0).toLocaleString('fr-DZ')} دج</Text></View>
              </View>
              <View style={styles.row}><View style={styles.openRow}><Ionicons name="chevron-back" size={15} color={colors.primary} /><Text style={[styles.open, { color: colors.primary }]}>التفاصيل والتتبع</Text></View>{!!order.created_at && <Text style={[styles.date, { color: colors.muted }]}>{new Date(order.created_at).toLocaleDateString('fr-DZ')}</Text>}</View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 17 },
  header: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  refresh: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', marginTop: 2 },
  state: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center', gap: 9 },
  stateTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  stateBody: { textAlign: 'center' },
  list: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 },
  badges: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  status: { fontWeight: '900', fontSize: 10.5 },
  id: { fontWeight: '900', flexShrink: 1, textAlign: 'right' },
  meta: { textAlign: 'right', writingDirection: 'rtl', fontSize: 12.5 },
  priceBox: { borderRadius: 16, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 10.5, marginBottom: 3 },
  price: { fontWeight: '900' },
  total: { fontWeight: '900', fontSize: 17 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  open: { fontWeight: '900', fontSize: 12 },
  date: { fontSize: 10.5 }
});
