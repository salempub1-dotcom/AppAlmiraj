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
  const [wilayaError, setWilayaError] = useState<string | null>(null);
  const [communes, setCommunes] = useState<CommuneOption[]>([]);
  const [selectedCommune, setSelectedCommune] = useState('');
  const [communeSearch, setCommuneSearch] = useState('');
  const [communeOpen, setCommuneOpen] = useState(false);
  const [communeError, setCommuneError] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [hubs, setHubs] = useState<PickupHub[]>([]);
  const [selectedHub, setSelectedHub] = useState<PickupHub | null>(null);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingDestination, setLoadingDestination] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadWilayas = async () => {
    setLoadingWilayas(true);
    setWilayaError(null);
    const { data, error } = await deliveryRepository.getWilayas();
    setWilayas(data);
    setWilayaError(error?.message ?? (data.length === 0 ? 'لم يتم العثور على ولايات.' : null));
    setLoadingWilayas(false);
  };

  useEffect(() => {
    loadWilayas();
  }, []);

  useEffect(() => {
    setSelectedCommune('');
    setCommuneSearch('');
    setCommuneOpen(false);
    setCommunes([]);
    setCommuneError(null);
    setQuote(null);
    setHubs([]);
    setSelectedHub(null);
    if (!selectedWilaya) return;

    setLoadingDestination(true);
    deliveryRepository.getCommunes(selectedWilaya.id).then(({ data, error }) => {
      setCommunes(data);
      setCommuneError(error?.message ?? (data.length === 0 ? 'لم يتم العثور على بلديات لهذه الولاية.' : null));
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
    if (!q) return wilayas;
    return wilayas.filter((w) => `${w.id} ${w.name}`.toLowerCase().includes(q));
  }, [wilayas, wilayaSearch]);

  const filteredCommunes = useMemo(() => {
    const q = communeSearch.trim().toLowerCase();
    if (!q) return communes;
    return communes.filter((c) => c.name.toLowerCase().includes(q));
  }, [communes, communeSearch]);

  const shipping = deliveryType === 'office' ? quote?.office : quote?.home;
  const finalTotal = cart.subtotal + (Number.isFinite(Number(shipping)) ? Number(shipping) : 0);
  const deliveryUnavailable = selectedCommune && quote && !Number.isFinite(Number(shipping));
  const phoneIsValid = /^(05|06|07)\d{8}$/.test(phone);

  const submit = async () => {
    if (!session) {
      Alert.alert('تسجيل الدخول مطلوب', 'أنشئ حسابًا أو سجّل الدخول قبل تأكيد الطلب.');
      return;
    }
    if (!customer.trim() || !phone.trim() || !selectedWilaya || !selectedCommune || !address.trim()) {
      Alert.alert('معلومات ناقصة', 'يرجى إكمال الاسم، الهاتف، الولاية، البلدية والعنوان.');
      return;
    }
    if (!phoneIsValid) {
      Alert.alert('رقم الهاتف غير صحيح', 'يجب أن يتكون رقم الهاتف من 10 أرقام ويبدأ بـ 05 أو 06 أو 07.');
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
      phone,
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

  const field = (label: string, value: string, setter: (v: string) => void, placeholder: string) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput value={value} onChangeText={setter} placeholder={placeholder} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} textAlign="right" />
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

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.text }]}>رقم الهاتف</Text>
        <TextInput
          value={phone}
          onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 10))}
          placeholder="05 / 06 / 07..."
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          maxLength={10}
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: phone.length > 0 && !phoneIsValid ? colors.danger : colors.border }]}
          textAlign="right"
        />
        {phone.length > 0 && !phoneIsValid ? <Text style={[styles.helperError, { color: colors.danger }]}>10 أرقام ويبدأ بـ 05 أو 06 أو 07.</Text> : null}
      </View>

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.text }]}>الولاية</Text>
        <Pressable onPress={() => setWilayaOpen((open) => !open)} style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name={wilayaOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
          <Text style={[styles.selectorText, { color: selectedWilaya ? colors.text : colors.muted }]}>{selectedWilaya?.name ?? (loadingWilayas ? 'جاري تحميل الولايات...' : 'اختر الولاية')}</Text>
        </Pressable>

        {wilayaOpen && !loadingWilayas ? (
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={wilayaSearch}
              onChangeText={setWilayaSearch}
              placeholder="ابحث باسم أو رقم الولاية"
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              textAlign="right"
            />
            {wilayaError ? (
              <View style={styles.dropdownMessage}>
                <Text style={[styles.helperError, { color: colors.danger }]}>{wilayaError}</Text>
                <Pressable onPress={loadWilayas}><Text style={[styles.retryText, { color: colors.primary }]}>إعادة المحاولة</Text></Pressable>
              </View>
            ) : filteredWilayas.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد نتيجة.</Text>
            ) : (
              <View style={styles.optionList}>
                {filteredWilayas.map((item) => <Pressable key={item.id} onPress={() => { setSelectedWilaya(item); setWilayaSearch(''); setWilayaOpen(false); }} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.optionMeta, { color: colors.primary }]}>{item.id}</Text><Text style={[styles.optionText, { color: colors.text }]}>{item.name}</Text></Pressable>)}
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.text }]}>البلدية</Text>
        <Pressable disabled={!selectedWilaya || loadingDestination} onPress={() => setCommuneOpen((open) => !open)} style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border, opacity: selectedWilaya ? 1 : 0.6 }]}>
          <Ionicons name={communeOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
          <Text style={[styles.selectorText, { color: selectedCommune ? colors.text : colors.muted }]}>{!selectedWilaya ? 'اختر الولاية أولًا' : loadingDestination && !selectedCommune ? 'جاري تحميل البلديات...' : selectedCommune || 'اختر البلدية'}</Text>
        </Pressable>

        {communeOpen && selectedWilaya && !loadingDestination ? (
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={communeSearch}
              onChangeText={setCommuneSearch}
              placeholder="ابحث عن البلدية"
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              textAlign="right"
            />
            {communeError ? (
              <Text style={[styles.helperError, { color: colors.danger }]}>{communeError}</Text>
            ) : filteredCommunes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد نتيجة.</Text>
            ) : (
              <View style={styles.optionList}>
                {filteredCommunes.map((item) => <Pressable key={item.name} onPress={() => { setSelectedCommune(item.name); setCommuneSearch(''); setCommuneOpen(false); }} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="location-outline" size={16} color={colors.primary} /><Text style={[styles.optionText, { color: colors.text }]}>{item.name}</Text></Pressable>)}
              </View>
            )}
          </View>
        ) : null}
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
  selector: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  selectorText: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontSize: 15 },
  dropdown: { borderWidth: 1, borderRadius: 16, padding: 10, gap: 8 },
  searchInput: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 14, writingDirection: 'rtl' },
  optionList: { gap: 7 },
  option: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  optionText: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontWeight: '800' },
  optionMeta: { fontSize: 12, fontWeight: '900' },
  dropdownMessage: { gap: 8, alignItems: 'flex-end' },
  retryText: { fontWeight: '900' },
  emptyText: { textAlign: 'right', paddingVertical: 8 },
  helperError: { textAlign: 'right', writingDirection: 'rtl', fontSize: 12, lineHeight: 18 },
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
