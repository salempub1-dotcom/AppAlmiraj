import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useCart } from '../../../context/CartProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { deliveryRepository, type CommuneOption, type PickupHub, type ShippingQuote, type WilayaOption } from '../../../repositories/deliveryRepository';
import { orderRepository } from '../../../repositories/orderRepository';

export function CheckoutScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const cart = useCart();
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [wilayas, setWilayas] = useState<WilayaOption[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaOption | null>(null);
  const [wilayaSearch, setWilayaSearch] = useState('');
  const [wilayaOpen, setWilayaOpen] = useState(false);
  const [communes, setCommunes] = useState<CommuneOption[]>([]);
  const [selectedCommune, setSelectedCommune] = useState('');
  const [communeSearch, setCommuneSearch] = useState('');
  const [communeOpen, setCommuneOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [hubs, setHubs] = useState<PickupHub[]>([]);
  const [selectedHub, setSelectedHub] = useState<PickupHub | null>(null);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingDestination, setLoadingDestination] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingWilayas(true);
    deliveryRepository.getWilayas().then(({ data }) => { setWilayas(data); setLoadingWilayas(false); });
  }, []);

  useEffect(() => {
    setSelectedCommune('');
    setCommuneSearch('');
    setCommuneOpen(false);
    setCommunes([]);
    setQuote(null);
    setHubs([]);
    setSelectedHub(null);
    if (!selectedWilaya) return;
    setLoadingDestination(true);
    deliveryRepository.getCommunes(selectedWilaya.id).then(({ data }) => { setCommunes(data); setLoadingDestination(false); });
  }, [selectedWilaya]);

  useEffect(() => {
    setQuote(null);
    setHubs([]);
    setSelectedHub(null);
    if (!selectedWilaya || !selectedCommune) return;
    setLoadingDestination(true);
    Promise.all([
      deliveryRepository.getQuote(selectedWilaya.id, selectedCommune),
      deliveryRepository.getPickupHubs(selectedWilaya.id, selectedCommune)
    ]).then(([quoteResult, hubsResult]) => {
      setQuote(quoteResult.data);
      setHubs(hubsResult.data);
      setLoadingDestination(false);
    });
  }, [selectedWilaya, selectedCommune]);

  const filteredWilayas = useMemo(() => {
    const q = wilayaSearch.trim().toLowerCase();
    return (q ? wilayas.filter((w) => `${w.id} ${w.name}`.toLowerCase().includes(q)) : wilayas).slice(0, 12);
  }, [wilayas, wilayaSearch]);

  const filteredCommunes = useMemo(() => {
    const q = communeSearch.trim().toLowerCase();
    return (q ? communes.filter((c) => c.name.toLowerCase().includes(q)) : communes).slice(0, 12);
  }, [communes, communeSearch]);

  const shipping = deliveryType === 'office' ? quote?.office : quote?.home;
  const shippingValue = Number.isFinite(Number(shipping)) ? Number(shipping) : 0;
  const finalTotal = cart.subtotal + shippingValue;
  const phoneIsValid = /^(05|06|07)\d{8}$/.test(phone);

  const submit = async () => {
    if (!session) return Alert.alert('تسجيل الدخول مطلوب', 'سجّل الدخول قبل تأكيد الطلب.');
    if (!customer.trim() || !phone.trim() || !selectedWilaya || !selectedCommune || !address.trim()) return Alert.alert('معلومات ناقصة', 'يرجى إكمال معلومات الاستلام.');
    if (!phoneIsValid) return Alert.alert('رقم الهاتف غير صحيح', 'أدخل 10 أرقام تبدأ بـ 05 أو 06 أو 07.');
    if (!Number.isFinite(Number(shipping))) return Alert.alert('التوصيل غير متاح', 'لا توجد تسعيرة توصيل لهذا الاختيار.');
    if (deliveryType === 'office' && !selectedHub) return Alert.alert('المكتب مطلوب', 'اختر مكتب ZR Express للاستلام.');

    setSubmitting(true);
    const { data, error } = await orderRepository.create({
      customer: customer.trim(), phone, wilaya: selectedWilaya.name, wilayaId: selectedWilaya.id,
      commune: selectedCommune, address: address.trim(), deliveryType,
      selectedOfficeId: deliveryType === 'office' ? selectedHub?.id ?? null : null,
      selectedOfficeName: deliveryType === 'office' ? selectedHub?.name ?? null : null,
      items: cart.items.map(({ product, quantity }) => ({ productId: product.id, quantity }))
    });
    setSubmitting(false);
    if (error || !data?.order) return Alert.alert('تعذر إنشاء الطلب', error?.message ?? 'حاول مرة أخرى.');
    cart.clear();
    Alert.alert('تم إنشاء الطلب', `رقم طلبك: ${data.order.tracking || data.order.id}`);
    navigation.navigate('MyOrders');
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="shield-checkmark-outline" size={25} color="#D4AF37" /></View>
        <Text style={styles.heroEyebrow}>AL MIRAJ CHECKOUT</Text>
        <Text style={styles.heroTitle}>إتمام الطلب</Text>
        <Text style={styles.heroText}>الدفع عند الاستلام • التوصيل عبر ZR Express</Text>
      </View>

      {!session ? <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="person-circle-outline" size={22} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.text }]}>يلزم تسجيل الدخول قبل تأكيد الطلب.</Text></View> : null}

      <Section title="معلومات المستلم" icon="person-outline" colors={colors}>
        <Field label="الاسم الكامل" value={customer} onChangeText={setCustomer} placeholder="اسم المستلم" colors={colors} />
        <Field label="رقم الهاتف" value={phone} onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="05 / 06 / 07..." keyboardType="phone-pad" colors={colors} invalid={phone.length > 0 && !phoneIsValid} />
      </Section>

      <Section title="عنوان التوصيل" icon="location-outline" colors={colors}>
        <Selector label="الولاية" value={selectedWilaya?.name} placeholder={loadingWilayas ? 'جاري تحميل الولايات...' : 'اختر الولاية'} open={wilayaOpen} setOpen={setWilayaOpen} colors={colors}>
          <TextInput value={wilayaSearch} onChangeText={setWilayaSearch} placeholder="ابحث باسم أو رقم الولاية" placeholderTextColor={colors.muted} style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} textAlign="right" />
          {filteredWilayas.map((item) => <Pressable key={item.id} onPress={() => { setSelectedWilaya(item); setWilayaOpen(false); setWilayaSearch(''); }} style={[styles.option, { borderBottomColor: colors.border }]}><Text style={[styles.optionMeta, { color: colors.primary }]}>{item.id}</Text><Text style={[styles.optionText, { color: colors.text }]}>{item.name}</Text></Pressable>)}
        </Selector>

        <Selector label="البلدية" value={selectedCommune} placeholder={!selectedWilaya ? 'اختر الولاية أولًا' : loadingDestination ? 'جاري التحميل...' : 'اختر البلدية'} open={communeOpen} setOpen={setCommuneOpen} colors={colors} disabled={!selectedWilaya || loadingDestination}>
          <TextInput value={communeSearch} onChangeText={setCommuneSearch} placeholder="ابحث عن البلدية" placeholderTextColor={colors.muted} style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} textAlign="right" />
          {filteredCommunes.map((item) => <Pressable key={item.name} onPress={() => { setSelectedCommune(item.name); setCommuneOpen(false); setCommuneSearch(''); }} style={[styles.option, { borderBottomColor: colors.border }]}><Ionicons name="location-outline" size={16} color={colors.primary} /><Text style={[styles.optionText, { color: colors.text }]}>{item.name}</Text></Pressable>)}
        </Selector>

        <Field label="العنوان" value={address} onChangeText={setAddress} placeholder="الحي، الشارع أو نقطة دالة" colors={colors} />
      </Section>

      <Section title="طريقة التوصيل" icon="car-outline" colors={colors}>
        <View style={styles.deliveryRow}>
          {(['home', 'office'] as const).map((type) => {
            const active = deliveryType === type;
            const price = type === 'home' ? quote?.home : quote?.office;
            return (
              <Pressable key={type} onPress={() => { setDeliveryType(type); setSelectedHub(null); }} style={[styles.deliveryCard, { backgroundColor: active ? '#132443' : colors.card, borderColor: active ? '#D4AF37' : colors.border }]}>
                <Ionicons name={type === 'home' ? 'home-outline' : 'business-outline'} size={24} color={active ? '#D4AF37' : colors.muted} />
                <Text style={[styles.deliveryTitle, { color: active ? '#FFFFFF' : colors.text }]}>{type === 'home' ? 'للمنزل' : 'للمكتب'}</Text>
                <Text style={[styles.deliveryPrice, { color: active ? '#D4AF37' : colors.primary }]}>{Number.isFinite(Number(price)) ? `${Number(price).toLocaleString('fr-DZ')} دج` : '—'}</Text>
              </Pressable>
            );
          })}
        </View>
        {loadingDestination && selectedCommune ? <ActivityIndicator color={colors.primary} /> : null}

        {deliveryType === 'office' && selectedCommune ? (
          <View style={styles.hubsWrap}>
            <Text style={[styles.label, { color: colors.text }]}>اختر مكتب الاستلام</Text>
            {hubs.length === 0 && !loadingDestination ? <Text style={[styles.helper, { color: colors.muted }]}>لا توجد مكاتب متاحة لهذا الاختيار.</Text> : null}
            {hubs.map((hub) => {
              const active = selectedHub?.id === hub.id;
              return <Pressable key={hub.id} onPress={() => setSelectedHub(hub)} style={[styles.hub, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.surface : colors.card }]}><View style={[styles.radio, { borderColor: active ? colors.primary : colors.border }]}>{active ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View><View style={{ flex: 1 }}><Text style={[styles.hubName, { color: colors.text }]}>{hub.name}</Text>{hub.address ? <Text style={[styles.hubAddress, { color: colors.muted }]}>{hub.address}</Text> : null}</View></Pressable>;
            })}
          </View>
        ) : null}
      </Section>

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>ملخص الطلب</Text>
        <SummaryRow label="المنتجات" value={`${cart.subtotal.toLocaleString('fr-DZ')} دج`} colors={colors} />
        <SummaryRow label="التوصيل" value={Number.isFinite(Number(shipping)) ? `${shippingValue.toLocaleString('fr-DZ')} دج` : '—'} colors={colors} />
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: colors.text }]}>المجموع</Text><Text style={styles.total}>{finalTotal.toLocaleString('fr-DZ')} دج</Text></View>
        <View style={styles.cod}><Ionicons name="cash-outline" size={17} color="#0B1833" /><Text style={styles.codText}>الدفع عند الاستلام</Text></View>
      </View>

      <Pressable onPress={submit} disabled={submitting || cart.items.length === 0} style={({ pressed }) => [styles.submit, { opacity: submitting || cart.items.length === 0 ? 0.5 : pressed ? 0.85 : 1 }]}>
        {submitting ? <ActivityIndicator color="#0B1833" /> : <><Ionicons name="checkmark-circle-outline" size={21} color="#0B1833" /><Text style={styles.submitText}>تأكيد الطلب</Text></>}
      </Pressable>
      <Text style={[styles.secureText, { color: colors.muted }]}>لن يتم خصم أي مبلغ الآن. الدفع عند استلام الطلب.</Text>
    </Screen>
  );
}

function Section({ title, icon, colors, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; colors: any; children: React.ReactNode }) {
  return <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.sectionHead}><View style={[styles.sectionIcon, { backgroundColor: colors.surface }]}><Ionicons name={icon} size={19} color={colors.primary} /></View><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text></View>{children}</View>;
}

function Field({ label, value, onChangeText, placeholder, colors, keyboardType, invalid }: any) {
  return <View style={styles.fieldWrap}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: invalid ? colors.danger : colors.border }]} textAlign="right" /></View>;
}

function Selector({ label, value, placeholder, open, setOpen, colors, disabled, children }: any) {
  return <View style={styles.fieldWrap}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><Pressable disabled={disabled} onPress={() => setOpen(!open)} style={[styles.selector, { borderColor: colors.border, backgroundColor: colors.surface, opacity: disabled ? 0.55 : 1 }]}><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} /><Text style={[styles.selectorText, { color: value ? colors.text : colors.muted }]}>{value || placeholder}</Text></Pressable>{open && !disabled ? <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View> : null}</View>;
}

function SummaryRow({ label, value, colors }: any) { return <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  page: { gap: 14 },
  hero: { backgroundColor: '#0B1833', borderRadius: 24, padding: 20, alignItems: 'flex-end', gap: 5 },
  heroIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#1B2A48', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  heroEyebrow: { color: '#D4AF37', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  heroText: { color: '#C7D0DE', fontSize: 12.5 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, textAlign: 'right', fontSize: 12.5, fontWeight: '700' },
  section: { borderWidth: 1, borderRadius: 20, padding: 15, gap: 13 },
  sectionHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, marginBottom: 1 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  fieldWrap: { gap: 6 },
  label: { textAlign: 'right', fontSize: 12.5, fontWeight: '800' },
  input: { minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 },
  selector: { minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectorText: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '600' },
  dropdown: { borderWidth: 1, borderRadius: 14, padding: 8, gap: 2 },
  search: { minHeight: 43, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, marginBottom: 5 },
  option: { minHeight: 42, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 7 },
  optionMeta: { fontSize: 11, fontWeight: '900' },
  optionText: { flex: 1, textAlign: 'right', fontWeight: '700' },
  deliveryRow: { flexDirection: 'row-reverse', gap: 10 },
  deliveryCard: { flex: 1, minHeight: 112, borderWidth: 1.5, borderRadius: 18, padding: 13, alignItems: 'center', justifyContent: 'center', gap: 7 },
  deliveryTitle: { fontSize: 13, fontWeight: '900' },
  deliveryPrice: { fontSize: 13, fontWeight: '900' },
  hubsWrap: { gap: 8 },
  helper: { textAlign: 'right', fontSize: 12 },
  hub: { borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  hubName: { textAlign: 'right', fontSize: 13, fontWeight: '800' },
  hubAddress: { textAlign: 'right', marginTop: 2, fontSize: 11 },
  summary: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  summaryTitle: { textAlign: 'right', fontSize: 17, fontWeight: '900', marginBottom: 2 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12.5, fontWeight: '600' },
  summaryValue: { fontSize: 13, fontWeight: '800' },
  summaryDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  totalRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '900' },
  total: { color: '#0B1833', fontSize: 21, fontWeight: '900' },
  cod: { alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#F6E8B9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  codText: { color: '#0B1833', fontSize: 10.5, fontWeight: '900' },
  submit: { minHeight: 56, borderRadius: 17, backgroundColor: '#D4AF37', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#0B1833', fontSize: 15.5, fontWeight: '900' },
  secureText: { textAlign: 'center', fontSize: 11.5, marginTop: -4 }
});
