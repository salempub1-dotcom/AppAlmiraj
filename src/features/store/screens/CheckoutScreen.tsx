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
  const [communes, setCommunes] = useState<CommuneOption[]>([]);
  const [selectedCommune, setSelectedCommune] = useState('');
  const [communeSearch, setCommuneSearch] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [hubs, setHubs] = useState<PickupHub[]>([]);
  const [selectedHub, setSelectedHub] = useState<PickupHub | null>(null);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingDestination, setLoadingDestination] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    deliveryRepository.getWilayas().then(({ data }) => {
      setWilayas(data);
      setLoadingWilayas(false);
    });
  }, []);

  useEffect(() => {
    setSelectedCommune('');
    setCommuneSearch('');
    setCommunes([]);
    setQuote(null);
    setHubs([]);
    setSelectedHub(null);
    if (!selectedWilaya) return;
    setLoadingDestination(true);
    deliveryRepository.getCommunes(selectedWilaya.id).then(({ data }) => {
      setCommunes(data);
      setLoadingDestination(false);
    });
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
    if (!q) return wilayas.slice(0, 10);
    return wilayas.filter((w) => `${w.id} ${w.name}`.toLowerCase().includes(q)).slice(0, 12);
  }, [wilayas, wilayaSearch]);

  const filteredCommunes = useMemo(() => {
    const q = communeSearch.trim().toLowerCase();
    if (!q) return communes.slice(0, 10);
    return communes.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 12);
  }, [communes, communeSearch]);

  const shipping = deliveryType === 'office' ? quote?.office : quote?.home;
  const finalTotal = cart.subtotal + (Number.isFinite(Number(shipping)) ? Number(shipping) : 0);
  const deliveryUnavailable = selectedCommune && quote && !Number.isFinite(Number(shipping));

  const submit = async () => {
    if (!session) {
      Alert.alert('تسجيل الدخول مطلوب', 'أنشئ حسابًا أو سجّل الدخول قبل تأكيد الطلب.');
      return;
    }
    if (!customer.trim() || !phone.trim() || !selectedWilaya || !selectedCommune || !address.trim()) {
      Alert.alert('معلومات ناقصة', 'يرجى إكمال الاسم، الهاتف، الولاية، البلدية والعنوان.');
      return;
    }
    if (!Number.isFinite(Number(shipping))) {
      Alert.alert('التوصيل غير متاح', 'لا توجد تسعيرة توصيل متاحة للاختيار الحالي.');
      return;
    }
    if (deliveryType === 'office' && !selectedHub) {
      Alert.alert('المكتب مطلوب', 'اختر مكتب ZR Express للاستلام.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await orderRepository.create({
      customer: customer.trim(),
      phone: phone.trim(),
      wilaya: selectedWilaya.name,
      wilayaId: selectedWilaya.id,
      commune: selectedCommune,
      address: address.trim(),
      deliveryType,
      selectedOfficeId: deliveryType === 'office' ? selectedHub?.id ?? null : null,
      selectedOfficeName: deliveryType === 'office' ? selectedHub?.name ?? null : null,
      items: cart.items.map(({ product, quantity }) => ({ productId: product.id, quantity }))
    });
    setSubmitting(false);

    if (error || !data?.order) {
      Alert.alert('تعذر إنشاء الطلب', error?.message ?? data?.error ?? 'حاول مرة أخرى.');
      return;
    }

    cart.clear();
    Alert.alert('تم إنشاء الطلب', `رقم طلبك: ${data.order.tracking || data.order.id}\nالإجمالي: ${Number(data.order.total).toLocaleString('fr-DZ')} دج`);
    navigation.navigate('MyOrders');
  };

  const field = (label: string, value: string, setter: (v: string) => void, placeholder: string, keyboardType?: 'phone-pad') => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} textAlign="right" />
    </View>
  );

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}><Ionicons name="receipt-outline" size={24} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>إتمام الطلب</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>الدفع عند الاستلام • ZR Express</Text>
        </View>
      </View>

      {!session && <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="person-circle-outline" size={22} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.text }]}>يلزم تسجيل الدخول قبل تأكيد الطلب.</Text></View>}

      {field('الاسم الكامل', customer, setCustomer, 'اسم المستلم')}
      {field('رقم الهاتف', phone, setPhone, '05 / 06 / 07...', 'phone-pad')}

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.text }]}>الولاية</Text>
        <TextInput value={wilayaSearch} onChangeText={(value) => { setWilayaSearch(value); if (selectedWilaya && value !== selectedWilaya.name) setSelectedWilaya(null); }} placeholder={loadingWilayas ? 'جاري تحميل الولايات...' : 'ابحث باسم أو رقم الولاية'} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} textAlign="right" />
        {!selectedWilaya && !loadingWilayas && wilayaSearch.length > 0 && <View style={styles.optionList}>{filteredWilayas.map((item) => <Pressable key={item.id} onPress={() => { setSelectedWilaya(item); setWilayaSearch(item.name); }} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.optionMeta, { color: colors.primary }]}>{item.id}</Text><Text style={[styles.optionText, { color: colors.text }]}>{item.name}</Text></Pressable>)}</View>}
      </View>

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.text }]}>البلدية</Text>
        <TextInput editable={!!selectedWilaya && !loadingDestination} value={communeSearch} onChangeText={(value) => { setCommuneSearch(value); if (selectedCommune && value !== selectedCommune) setSelectedCommune(''); }} placeholder={!selectedWilaya ? 'اختر الولاية أولًا' : loadingDestination ? 'جاري تحميل البلديات...' : 'ابحث عن البلدية'} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, opacity: selectedWilaya ? 1 : 0.6 }]} textAlign="right" />
        {!selectedCommune && selectedWilaya && communeSearch.length > 0 && <View style={styles.optionList}>{filteredCommunes.map((item) => <Pressable key={item.name} onPress={() => { setSelectedCommune(item.name); setCommuneSearch(item.name); }} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="location-outline" size={16} color={colors.primary} /><Text style={[styles.optionText, { color: colors.text }]}>{item.name}</Text></Pressable>)}</View>}
      </View>

      {field('العنوان', address, setAddress, 'الحي، الشارع أو نقطة دالة')}

      <Text style={[styles.label, { color: colors.text }]}>نوع التوصيل</Text>
      <View style={styles.deliveryRow}>
        {(['home', 'office'] as const).map((type) => {
          const active = deliveryType === type;
          const price = type === 'home' ? quote?.home : quote?.office;
          return <Pressable key={type} onPress={() => { setDeliveryType(type); setSelectedHub(null); }} style={[styles.deliveryCard, { backgroundColor: active ? colors.surface : colors.card, borderColor: active ? colors.primary : colors.border }]}><Ionicons name={type === 'home' ? 'home-outline' : 'business-outline'} size={23} color={active ? colors.primary : colors.muted} /><Text style={[styles.deliveryText, { color: colors.text }]}>{type === 'home' ? 'للمنزل' : 'للمكتب'}</Text><Text style={[styles.deliveryPrice, { color: Number.isFinite(Number(price)) ? colors.primary : colors.muted }]}>{Number.isFinite(Number(price)) ? `${Number(price).toLocaleString('fr-DZ')} دج` : selectedCommune ? 'غير متاح' : '—'}</Text></Pressable>;
        })}
      </View>

      {loadingDestination && selectedCommune ? <ActivityIndicator color={colors.primary} /> : null}

      {deliveryType === 'office' && selectedCommune && (
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.text }]}>مكتب ZR Express</Text>
          {hubs.length === 0 && !loadingDestination ? <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="business-outline" size={20} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.text }]}>لا يوجد مكتب استلام متاح لهذه الوجهة حاليًا.</Text></View> : null}
          <View style={styles.optionList}>{hubs.map((hub) => { const active = selectedHub?.id === hub.id; return <Pressable key={hub.id} onPress={() => setSelectedHub(hub)} style={[styles.hubOption, { backgroundColor: active ? colors.surface : colors.card, borderColor: active ? colors.primary : colors.border }]}><View style={styles.hubCopy}><Text style={[styles.optionText, { color: colors.text }]}>{hub.name}</Text>{!!hub.address && <Text style={[styles.hubAddress, { color: colors.muted }]}>{hub.address}</Text>}</View><Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.primary : colors.muted} /></Pressable>; })}</View>
        </View>
      )}

      {deliveryUnavailable ? <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="alert-circle-outline" size={21} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.text }]}>نوع التوصيل المختار غير متاح لهذه الوجهة.</Text></View> : null}

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}><Text style={{ color: colors.muted }}>المنتجات</Text><Text style={[styles.value, { color: colors.text }]}>{cart.subtotal.toLocaleString('fr-DZ')} دج</Text></View>
        <View style={styles.row}><Text style={{ color: colors.muted }}>التوصيل</Text><Text style={[styles.value, { color: Number.isFinite(Number(shipping)) ? colors.text : colors.muted }]}>{Number.isFinite(Number(shipping)) ? `${Number(shipping).toLocaleString('fr-DZ')} دج` : '—'}</Text></View>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <View style={styles.row}><Text style={[styles.totalLabel, { color: colors.text }]}>الإجمالي</Text><Text style={[styles.totalValue, { color: colors.primary }]}>{finalTotal.toLocaleString('fr-DZ')} دج</Text></View>
      </View>

      <Pressable disabled={submitting || cart.items.length === 0 || !Number.isFinite(Number(shipping))} onPress={submit} style={[styles.submit, { backgroundColor: colors.primary, opacity: submitting || !Number.isFinite(Number(shipping)) ? 0.55 : 1 }]}><Ionicons name="checkmark-circle-outline" size={21} color={colors.onPrimary} /><Text style={[styles.submitText, { color: colors.onPrimary }]}>{submitting ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب'}</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  header: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', marginTop: 2 },
  notice: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '700', lineHeight: 21 },
  fieldWrap: { gap: 7 },
  label: { textAlign: 'right', fontWeight: '900', fontSize: 14 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 15, writingDirection: 'rtl' },
  optionList: { gap: 7 },
  option: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  optionText: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '800' },
  optionMeta: { fontSize: 12, fontWeight: '900' },
  deliveryRow: { flexDirection: 'row-reverse', gap: 10 },
  deliveryCard: { flex: 1, minHeight: 108, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7 },
  deliveryText: { fontWeight: '900' },
  deliveryPrice: { fontSize: 12, fontWeight: '900' },
  hubOption: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  hubCopy: { flex: 1, gap: 4 },
  hubAddress: { textAlign: 'right', writingDirection: 'rtl', fontSize: 11.5, lineHeight: 18 },
  summary: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontWeight: '900' },
  separator: { height: StyleSheet.hairlineWidth },
  totalLabel: { fontWeight: '900', fontSize: 17 },
  totalValue: { fontWeight: '900', fontSize: 21 },
  submit: { minHeight: 58, borderRadius: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontWeight: '900', fontSize: 16 }
});
