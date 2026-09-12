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

function getStatusTone(status?: string) {
  if (status === 'cancelled' || status === 'delivery_issue' || status === 'delivery_attempt_failed') {
    return { bg: '#FDECEC', fg: '#B42318' };
  }
  if (status === 'delivered' || status === 'confirmed') {
    return { bg: '#EAF7EF', fg: '#247A45' };
  }
  return { bg: '#FFF6DB', fg: '#8C6500' };
}

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

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session]);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Pressable onPress={load} disabled={!session || loading} style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={18} color="#D4AF37" />
          </Pressable>
          <View style={styles.heroBadge}>
            <Ionicons name="cube-outline" size={19} color="#D4AF37" />
            <Text style={styles.heroBadgeText}>AL MIRAJ ORDERS</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>طلباتي</Text>
        <Text style={styles.heroSubtitle}>تابع حالة طلباتك، التوصيل والمبالغ من مكان واحد.</Text>
      </View>

      {!session && (
        <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stateIcon}><Ionicons name="person-circle-outline" size={31} color="#D4AF37" /></View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>سجّل الدخول لعرض طلباتك</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>بعد تسجيل الدخول ستظهر كل طلباتك السابقة والحالية هنا.</Text>
        </View>
      )}

      {loading && <ActivityIndicator color={colors.primary} />}

      {error && (
        <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stateIcon}><Ionicons name="cloud-offline-outline" size={28} color="#D4AF37" /></View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل الطلبات</Text>
          <Pressable onPress={load} style={styles.retryButton}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable>
        </View>
      )}

      {!loading && !error && session && orders.length === 0 && (
        <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stateIcon}><Ionicons name="receipt-outline" size={29} color="#D4AF37" /></View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>لا توجد طلبات بعد</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>أي طلب تنشئه من متجر المعراج سيظهر هنا مباشرة.</Text>
        </View>
      )}

      <View style={styles.list}>
        {orders.map((order) => {
          const delivery = deliveryLabels[order.delivery_status] || null;
          const orderTone = getStatusTone(order.status);
          const deliveryTone = getStatusTone(order.delivery_status);

          return (
            <Pressable
              key={order.id}
              onPress={() => navigation.navigate('OrderDetail', { order })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.orderIcon}><Ionicons name="receipt-outline" size={20} color="#0B1833" /></View>
                <View style={styles.orderMain}>
                  <Text numberOfLines={1} style={[styles.id, { color: colors.text }]}>{order.tracking || order.id}</Text>
                  {!!order.created_at && <Text style={[styles.date, { color: colors.muted }]}>{new Date(order.created_at).toLocaleDateString('fr-DZ')}</Text>}
                </View>
                <Ionicons name="chevron-back" size={18} color={colors.muted} />
              </View>

              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: orderTone.bg }]}><Text style={[styles.status, { color: orderTone.fg }]}>{statusLabels[order.status] ?? order.status}</Text></View>
                {delivery && <View style={[styles.badge, { backgroundColor: deliveryTone.bg }]}><Text style={[styles.status, { color: deliveryTone.fg }]}>{delivery}</Text></View>}
              </View>

              <View style={[styles.destination, { backgroundColor: colors.surface }]}>
                <Ionicons name={order.delivery_type === 'office' ? 'business-outline' : 'home-outline'} size={17} color={colors.muted} />
                <Text numberOfLines={2} style={[styles.meta, { color: colors.muted }]}>{order.wilaya}{order.commune ? ` • ${order.commune}` : ''} • {order.delivery_type === 'office' ? 'مكتب' : 'منزل'}</Text>
              </View>

              <View style={styles.priceRow}>
                <View>
                  <Text style={[styles.priceLabel, { color: colors.muted }]}>التوصيل</Text>
                  <Text style={[styles.price, { color: colors.text }]}>{Number(order.shipping ?? 0).toLocaleString('fr-DZ')} دج</Text>
                </View>
                <View style={styles.totalWrap}>
                  <Text style={[styles.priceLabel, { color: colors.muted }]}>الإجمالي</Text>
                  <Text style={styles.total}>{Number(order.total ?? 0).toLocaleString('fr-DZ')} دج</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  hero: { backgroundColor: '#0B1833', borderRadius: 26, padding: 20, gap: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  heroBadgeText: { color: '#D4AF37', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', textAlign: 'right' },
  heroSubtitle: { color: '#C7D0DF', fontSize: 13, lineHeight: 21, textAlign: 'right' },
  refresh: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#172745', alignItems: 'center', justifyContent: 'center' },
  state: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center', gap: 9 },
  stateIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  stateBody: { textAlign: 'center', lineHeight: 20, fontSize: 12.5 },
  retryButton: { marginTop: 3, minHeight: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 },
  list: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 22, padding: 15, gap: 12, shadowColor: '#000000', shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  orderIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  orderMain: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
  id: { fontWeight: '900', fontSize: 15, textAlign: 'right' },
  date: { fontSize: 10.5, marginTop: 2 },
  badges: { flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  status: { fontWeight: '900', fontSize: 10.5 },
  destination: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 10 },
  meta: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontSize: 12.5, lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontSize: 10.5, marginBottom: 3 },
  price: { fontWeight: '900', fontSize: 13.5 },
  totalWrap: { alignItems: 'flex-end' },
  total: { color: '#B38B18', fontWeight: '900', fontSize: 18 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }
});
