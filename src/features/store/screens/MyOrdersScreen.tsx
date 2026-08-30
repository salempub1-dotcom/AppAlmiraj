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
        <View style={[styles.icon, { backgroundColor: colors.surface }]}><Ionicons name="cube-outline" size={24} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>طلباتي</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>تابع طلباتك القادمة من التطبيق</Text>
        </View>
      </View>

      {!session && <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="person-circle-outline" size={36} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text }]}>سجّل الدخول لعرض طلباتك</Text></View>}
      {loading && <ActivityIndicator color={colors.primary} />}
      {error && <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل الطلبات</Text><Pressable onPress={load}><Text style={{ color: colors.primary, fontWeight: '900' }}>إعادة المحاولة</Text></Pressable></View>}
      {!loading && !error && session && orders.length === 0 && <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="receipt-outline" size={36} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text }]}>لا توجد طلبات بعد</Text><Text style={[styles.stateBody, { color: colors.muted }]}>أي طلب تنشئه من التطبيق سيظهر هنا.</Text></View>}

      <View style={styles.list}>
        {orders.map((order) => (
          <Pressable key={order.id} onPress={() => navigation.navigate('OrderDetail', { order })} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.row}><Text style={[styles.status, { color: colors.primary }]}>{statusLabels[order.status] ?? order.status}</Text><Text style={[styles.id, { color: colors.text }]}>{order.id}</Text></View>
            <Text style={[styles.meta, { color: colors.muted }]}>{order.wilaya}{order.commune ? ` • ${order.commune}` : ''}</Text>
            <View style={styles.row}><Text style={[styles.open, { color: colors.primary }]}>عرض التفاصيل</Text><Text style={[styles.total, { color: colors.text }]}>{Number(order.total ?? 0).toLocaleString('fr-DZ')} دج</Text></View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 17 },
  header: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', marginTop: 2 },
  state: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center', gap: 9 },
  stateTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  stateBody: { textAlign: 'center' },
  list: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontWeight: '900', fontSize: 12 },
  id: { fontWeight: '900' },
  meta: { textAlign: 'right', writingDirection: 'rtl' },
  total: { fontWeight: '900', fontSize: 17 },
  open: { fontWeight: '900', fontSize: 12 }
});
