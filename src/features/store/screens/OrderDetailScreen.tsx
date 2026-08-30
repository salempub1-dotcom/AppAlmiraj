import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { deliveryRepository } from '../../../repositories/deliveryRepository';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  waiting_customer: 'في انتظار العميل',
  cancelled: 'ملغي'
};

const deliveryLabels: Record<string, string> = {
  in_preparation: 'قيد التحضير',
  shipped: 'في الطريق',
  out_for_delivery: 'خرج للتسليم',
  delivered: 'تم التسليم',
  delivery_issue: 'مشكلة في التوصيل',
  unknown: 'قيد التحديث'
};

export function OrderDetailScreen({ route }: any) {
  const { colors } = useTheme();
  const order = route.params?.order;
  const items = Array.isArray(order?.items) ? order.items : [];
  const [tracking, setTracking] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const loadTracking = async () => {
    const number = String(order?.tracking || '').trim();
    if (!number) return;
    setTrackingLoading(true);
    setTrackingError(null);
    const { data, error } = await deliveryRepository.track(number);
    setTrackingLoading(false);
    if (error) {
      setTrackingError(error.message);
      return;
    }
    setTracking(data);
  };

  useEffect(() => { loadTracking(); }, [order?.tracking]);

  const liveDeliveryStatus = tracking?.deliveryStatus || order?.delivery_status || null;
  const liveDeliveryLabel = tracking?.deliveryLabel || deliveryLabels[liveDeliveryStatus] || null;
  const history = Array.isArray(tracking?.history) ? tracking.history : [];

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.icon, { backgroundColor: colors.surface }]}><Ionicons name="receipt-outline" size={24} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.text }]}>{order?.tracking || order?.id}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.surface }]}><Text style={[styles.status, { color: colors.primary }]}>{statusLabels[order?.status] ?? order?.status}</Text></View>
          {liveDeliveryLabel && <View style={[styles.badge, { backgroundColor: colors.surface }]}><Text style={[styles.status, { color: colors.primary }]}>{liveDeliveryLabel}</Text></View>}
        </View>
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
        <Text style={[styles.line, { color: colors.text }]}>النوع: {order?.delivery_type === 'office' ? 'مكتب ZR Express' : 'توصيل للمنزل'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.trackingHeader}>
          <Pressable onPress={loadTracking} disabled={trackingLoading} style={[styles.refresh, { backgroundColor: colors.surface }]}><Ionicons name="refresh-outline" size={17} color={colors.primary} /><Text style={[styles.refreshText, { color: colors.primary }]}>تحديث</Text></Pressable>
          <Text style={[styles.heading, { color: colors.text }]}>تتبع الطلب</Text>
        </View>

        {trackingLoading && <ActivityIndicator color={colors.primary} />}
        {trackingError && <Text style={[styles.line, { color: colors.muted }]}>{trackingError}</Text>}
        {!trackingLoading && !trackingError && tracking && (
          <>
            <View style={[styles.trackState, { backgroundColor: colors.surface }]}>
              <Ionicons name={liveDeliveryStatus === 'delivered' ? 'checkmark-circle-outline' : 'navigate-circle-outline'} size={26} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackTitle, { color: colors.text }]}>{liveDeliveryLabel || 'الطلب قيد المعالجة'}</Text>
                {!!tracking.message && <Text style={[styles.trackBody, { color: colors.muted }]}>{tracking.message}</Text>}
              </View>
            </View>
            {history.length > 0 && <View style={styles.timeline}>{history.slice().reverse().map((event: any, index: number) => <View key={`${event.occurredAt || index}-${index}`} style={styles.timelineRow}><View style={[styles.timelineDot, { backgroundColor: index === 0 ? colors.primary : colors.border }]} /><View style={styles.timelineCopy}><Text style={[styles.timelineLabel, { color: colors.text }]}>{event.label || 'تحديث الشحنة'}</Text>{!!event.occurredAt && <Text style={[styles.timelineDate, { color: colors.muted }]}>{new Date(event.occurredAt).toLocaleString('fr-DZ')}</Text>}</View></View>)}</View>}
          </>
        )}
        {!trackingLoading && !trackingError && !tracking && <Text style={[styles.line, { color: colors.muted }]}>سيظهر التتبع هنا بعد إنشاء الطلب وإرساله لشركة التوصيل.</Text>}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.totalRow}><Text style={[styles.muted, { color: colors.muted }]}>سعر التوصيل</Text><Text style={[styles.value, { color: colors.text }]}>{Number(order?.shipping ?? 0) > 0 ? `${Number(order.shipping).toLocaleString('fr-DZ')} دج` : '—'}</Text></View>
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
  badgeRow: { flexDirection: 'row-reverse', gap: 7, flexWrap: 'wrap' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  status: { fontWeight: '900', fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 10 },
  heading: { fontWeight: '900', fontSize: 17, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemName: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '800' },
  muted: { fontSize: 13 },
  line: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refresh: { flexDirection: 'row-reverse', gap: 5, alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  refreshText: { fontSize: 11.5, fontWeight: '900' },
  trackState: { borderRadius: 17, padding: 14, flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' },
  trackTitle: { textAlign: 'right', fontWeight: '900' },
  trackBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 21, fontSize: 12.5, marginTop: 4 },
  timeline: { gap: 0, marginTop: 4 },
  timelineRow: { flexDirection: 'row-reverse', gap: 10, minHeight: 54 },
  timelineDot: { width: 10, height: 10, borderRadius: 99, marginTop: 5 },
  timelineCopy: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9DDE5', paddingBottom: 11 },
  timelineLabel: { textAlign: 'right', writingDirection: 'rtl', fontWeight: '800', lineHeight: 20 },
  timelineDate: { textAlign: 'right', fontSize: 10.5, marginTop: 3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontWeight: '800' },
  total: { fontSize: 20, fontWeight: '900' }
});
