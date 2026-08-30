import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useCart } from '../../../context/CartProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { orderRepository } from '../../../repositories/orderRepository';

export function CheckoutScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const cart = useCart();
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'home' | 'office'>('home');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!session) {
      Alert.alert('تسجيل الدخول مطلوب', 'أنشئ حسابًا أو سجّل الدخول قبل تأكيد الطلب.');
      return;
    }
    if (!customer.trim() || !phone.trim() || !wilaya.trim() || !address.trim()) {
      Alert.alert('معلومات ناقصة', 'يرجى إكمال الاسم، الهاتف، الولاية والعنوان.');
      return;
    }
    if (deliveryType === 'office' && !selectedOffice.trim()) {
      Alert.alert('المكتب مطلوب', 'اكتب اسم مكتب التوصيل الذي تريد الاستلام منه.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await orderRepository.create({
      customer: customer.trim(),
      phone: phone.trim(),
      wilaya: wilaya.trim(),
      commune: commune.trim(),
      address: address.trim(),
      deliveryType,
      selectedOffice: deliveryType === 'office' ? selectedOffice.trim() : null,
      items: cart.items.map(({ product, quantity }) => ({ productId: product.id, quantity }))
    });
    setSubmitting(false);

    if (error || !data?.order) {
      Alert.alert('تعذر إنشاء الطلب', error?.message ?? 'حاول مرة أخرى.');
      return;
    }

    cart.clear();
    Alert.alert('تم إنشاء الطلب', `رقم طلبك: ${data.order.id}\nسيتم تأكيد سعر التوصيل عند معالجة الطلب.`);
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
          <Text style={[styles.subtitle, { color: colors.muted }]}>الدفع عند الاستلام</Text>
        </View>
      </View>

      {!session && <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="person-circle-outline" size={22} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.text }]}>يلزم تسجيل الدخول قبل تأكيد الطلب.</Text></View>}

      {field('الاسم الكامل', customer, setCustomer, 'اسم المستلم')}
      {field('رقم الهاتف', phone, setPhone, '05 / 06 / 07...', 'phone-pad')}
      {field('الولاية', wilaya, setWilaya, 'مثال: الجزائر')}
      {field('البلدية', commune, setCommune, 'البلدية')}
      {field('العنوان', address, setAddress, 'العنوان بالتفصيل')}

      <Text style={[styles.label, { color: colors.text }]}>نوع التوصيل</Text>
      <View style={styles.deliveryRow}>
        {(['home', 'office'] as const).map((type) => {
          const active = deliveryType === type;
          return <Pressable key={type} onPress={() => setDeliveryType(type)} style={[styles.deliveryCard, { backgroundColor: active ? colors.surface : colors.card, borderColor: active ? colors.primary : colors.border }]}><Ionicons name={type === 'home' ? 'home-outline' : 'business-outline'} size={23} color={active ? colors.primary : colors.muted} /><Text style={[styles.deliveryText, { color: colors.text }]}>{type === 'home' ? 'للمنزل' : 'للمكتب'}</Text></Pressable>;
        })}
      </View>

      {deliveryType === 'office' && field('مكتب الاستلام', selectedOffice, setSelectedOffice, 'اسم المكتب أو المنطقة')}

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}><Text style={{ color: colors.muted }}>المنتجات</Text><Text style={[styles.value, { color: colors.text }]}>{cart.subtotal.toLocaleString('fr-DZ')} دج</Text></View>
        <View style={styles.row}><Text style={{ color: colors.muted }}>التوصيل</Text><Text style={[styles.value, { color: colors.primary }]}>يؤكد لاحقًا</Text></View>
      </View>

      <Pressable disabled={submitting || cart.items.length === 0} onPress={submit} style={[styles.submit, { backgroundColor: colors.primary, opacity: submitting ? 0.65 : 1 }]}><Ionicons name="checkmark-circle-outline" size={21} color={colors.onPrimary} /><Text style={[styles.submitText, { color: colors.onPrimary }]}>{submitting ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب'}</Text></Pressable>
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
  noticeText: { flex: 1, textAlign: 'right', fontWeight: '700' },
  fieldWrap: { gap: 7 },
  label: { textAlign: 'right', fontWeight: '900', fontSize: 14 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 15, writingDirection: 'rtl' },
  deliveryRow: { flexDirection: 'row-reverse', gap: 10 },
  deliveryCard: { flex: 1, minHeight: 90, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7 },
  deliveryText: { fontWeight: '900' },
  summary: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontWeight: '900' },
  submit: { minHeight: 58, borderRadius: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontWeight: '900', fontSize: 16 }
});
