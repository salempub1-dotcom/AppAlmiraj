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
  in_transit: 'في الطريق',
  out_for_delivery: 'خرج للتسليم',
  delivered: 'تم التسليم',
  returned: 'مرتجع',
  delivery_issue: 'مشكلة في التوصيل',
  delivery_attempt_failed: 'تعذر التسليم',
  unknown: 'قيد التحديث'
};

function getStatusTone(status?: string) {
  if (status === 'cancelled' || status === 'delivery_issue' || status === 'delivery_attempt_failed' || status === 'returned') return { bg: '#FDECEC', fg: '#B42318' };
  if (status === 'delivered' || status === 'confirmed') return { bg: '#EAF7EF', fg: '#247A45' };
  return { bg: '#FFF6DB', fg: '#8C6500' };
}

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
  const orderTone = getStatusTone(order?.status);
  const deliveryTone = getStatusTone(liveDeliveryStatus);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="receipt-outline" size={23} color="#0B1833" /></View>
        <Text style={styles.eyebrow}>ORDER DETAILS</Text>
        <Text style={styles.title}>{order?.tracking || order?.id}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: orderTone.bg }]}><Text style={[styles.status, { color: orderTone.fg }]}>{statusLabels[order?.status] ?? order?.status}</Text></View>
          {liveDeliveryLabel && <View style={[styles.badge, { backgroundColor: deliveryTone.bg }]}><Text style={[styles.status, { color: deliveryTone.fg }]}>{liveDeliveryLabel}</Text></View>}
        </View>
      </View>

      <Section title="المنتجات" icon="bag-handle-outline" colors={colors}>
        {items.length === 0 ? (
          <Text style={[styles.emptyLine, { color: colors.muted }]}>لا توجد تفاصيل منتجات متاحة.</Text>
        ) : items.map((item: any, index: number) => (
          <View key={`${item.id}-${index}`} style={[styles.itemRow, index < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.qtyBadge, { backgroundColor: colors.surface }]}><Text style={[styles.qtyText, { color: colors.text }]}>x{item.quantity ?? 1}</Text></View>
            <Text style={[styles.itemName, { color: colors.text }]}>{String(item.name ?? '').trim()}</Text>
          </View>
        ))}
      </Section>

      <Section title="التوصيل" icon="location-outline" colors={colors}>
        <InfoRow icon="map-outline" label="الولاية" value={order?.wilaya ?? '-'} colors={colors} />
        <InfoRow icon="navigate-outline" label="البلدية" value={order?.commune ?? '-'} colors={colors} />
        <InfoRow icon="pin-outline" label="العنوان" value={order?.address ?? '-'} colors={colors} />
        <InfoRow icon={order?.delivery_type === 'office' ? 'business-outline' : 'home-outline'} label="نوع التوصيل" value={order?.delivery_type === 'office' ? 'مكتب ZR Express' : 'توصيل للمنزل'} colors={colors} />
      </Section>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.trackingHeader}>
          <Pressable onPress={loadTracking} disabled={trackingLoading} style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={16} color="#D4AF37" />
            <Text style={styles.refreshText}>تحديث</Text>
          </Pressable>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.heading, { color: colors.text }]}>تتبع الطلب</Text>
            <View style={styles.sectionIcon}><Ionicons name="navigate-circle-outline" size={18} color="#D4AF37" /></View>
          </View>
        </View>

        {trackingLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />}
        {trackingError && <Text style={[styles.emptyLine, { color: colors.muted }]}>{trackingError}</Text>}

        {!trackingLoading && !trackingError && tracking && (
          <>
            <View style={[styles.trackState, { backgroundColor: colors.surface }]}>
              <View style={styles.trackStateIcon}>
                <Ionicons name={liveDeliveryStatus === 'delivered' ? 'checkmark-circle' : 'navigate-circle'} size={25} color="#0B1833" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackTitle, { color: colors.text }]}>{liveDeliveryLabel || 'الطلب قيد المعالجة'}</Text>
                {!!tracking.message && <Text style={[styles.trackBody, { color: colors.muted }]}>{tracking.message}</Text>}
              </View>
            </View>

            {history.length > 0 && (
              <View style={styles.timeline}>
                {history.slice().reverse().map((event: any, index: number) => (
                  <View key={`${event.occurredAt || index}-${index}`} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={[styles.timelineDot, { backgroundColor: index === 0 ? '#D4AF37' : colors.border }]} />
                      {index < history.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                    </View>
                    <View style={styles.timelineCopy}>
                      <Text style={[styles.timelineLabel, { color: colors.text }]}>{event.label || 'تحديث الشحنة'}</Text>
                      {!!event.occurredAt && <Text style={[styles.timelineDate, { color: colors.muted }]}>{new Date(event.occurredAt).toLocaleString('fr-DZ')}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {!trackingLoading && !trackingError && !tracking && <Text style={[styles.emptyLine, { color: colors.muted }]}>سيظهر التتبع هنا بعد إرسال الطلب إلى شركة التوصيل.</Text>}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>سعر التوصيل</Text><Text style={styles.shippingValue}>{Number(order?.shipping ?? 0) > 0 ? `${Number(order.shipping).toLocaleString('fr-DZ')} دج` : '—'}</Text></View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}><Text style={styles.grandLabel}>الإجمالي</Text><Text style={styles.total}>{Number(order?.total ?? 0).toLocaleString('fr-DZ')} دج</Text></View>
      </View>
    </Screen>
  );
}

function Section({ title, icon, colors, children }: any) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.heading, { color: colors.text }]}>{title}</Text>
        <View style={styles.sectionIcon}><Ionicons name={icon} size={18} color="#D4AF37" /></View>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}><Ionicons name={icon} size={16} color={colors.muted} /></View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14 },
  hero: { backgroundColor: '#0B1833', borderRadius: 26, padding: 20, alignItems: 'flex-end', gap: 7 },
  heroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'right' },
  badgeRow: { flexDirection: 'row-reverse', gap: 7, flexWrap: 'wrap' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  status: { fontWeight: '900', fontSize: 11 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  sectionTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, fontWeight: '900', fontSize: 16, textAlign: 'right' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  qtyBadge: { minWidth: 38, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontWeight: '900', fontSize: 12 },
  itemName: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '800', lineHeight: 20 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 3 },
  infoIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, alignItems: 'flex-end' },
  infoLabel: { fontSize: 10.5, fontWeight: '700' },
  infoValue: { marginTop: 2, fontSize: 13.5, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl' },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  refresh: { flexDirection: 'row-reverse', gap: 5, alignItems: 'center', backgroundColor: '#0B1833', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  refreshText: { color: '#D4AF37', fontSize: 11.5, fontWeight: '900' },
  trackState: { borderRadius: 17, padding: 13, flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' },
  trackStateIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  trackTitle: { textAlign: 'right', fontWeight: '900' },
  trackBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 20, fontSize: 12.5, marginTop: 3 },
  timeline: { marginTop: 3 },
  timelineRow: { flexDirection: 'row-reverse', gap: 10, minHeight: 56 },
  timelineRail: { width: 14, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 99, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginVertical: 3 },
  timelineCopy: { flex: 1, paddingBottom: 12 },
  timelineLabel: { textAlign: 'right', writingDirection: 'rtl', fontWeight: '800', lineHeight: 20 },
  timelineDate: { textAlign: 'right', fontSize: 10.5, marginTop: 2 },
  emptyLine: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 21, fontSize: 12.5 },
  totalCard: { backgroundColor: '#0B1833', borderRadius: 20, padding: 17, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#C7D0DF', fontSize: 12.5, fontWeight: '700' },
  shippingValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  totalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#2C3A57' },
  grandLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  total: { color: '#D4AF37', fontSize: 21, fontWeight: '900' },
  pressed: { opacity: 0.78 }
});
