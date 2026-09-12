import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getStoreCopy } from '../../../i18n/storeCopy';

export function CartScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getStoreCopy(language).cart;
  const cart = useCart();
  const row = isRTL ? 'row-reverse' as const : 'row' as const;
  const align = isRTL ? 'right' as const : 'left' as const;
  const direction = isRTL ? 'rtl' as const : 'ltr' as const;

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.header, { flexDirection: row }]}>
        <View style={styles.iconBox}><Ionicons name="bag-handle-outline" size={22} color="#D4AF37" /></View>
        <View style={[styles.headerCopy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{cart.count} {cart.count === 1 ? copy.item : copy.items}</Text>
        </View>
      </View>

      {cart.items.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.emptyIcon}><Ionicons name="bag-outline" size={34} color="#D4AF37" /></View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{copy.emptyTitle}</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>{copy.emptyBody}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.emptyButton}><Text style={styles.emptyButtonText}>{language === 'ar' ? 'متابعة التسوق' : 'Continue shopping'}</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {cart.items.map(({ product, quantity }) => (
              <View key={product.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
                {product.images?.[0] ? <Image source={{ uri: product.images[0] }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: colors.surface }]} />}
                <View style={styles.itemCopy}>
                  <Text numberOfLines={2} style={[styles.name, { color: colors.text, textAlign: align, writingDirection: direction }]}>{product.name.trim()}</Text>
                  <Text style={[styles.price, { color: '#0B1833', textAlign: align }]}>{(product.price * quantity).toLocaleString('fr-DZ')} دج</Text>
                  <View style={[styles.controls, { flexDirection: row }]}>
                    <View style={[styles.stepper, { borderColor: colors.border, flexDirection: row }]}>
                      <Pressable onPress={() => cart.increment(product.id)} style={styles.stepperButton}><Ionicons name="add" size={17} color={colors.text} /></Pressable>
                      <Text style={[styles.qty, { color: colors.text }]}>{quantity}</Text>
                      <Pressable onPress={() => cart.decrement(product.id)} style={styles.stepperButton}><Ionicons name="remove" size={17} color={colors.text} /></Pressable>
                    </View>
                    <Pressable onPress={() => cart.remove(product.id)} style={[styles.remove, { marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }]}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.summaryHeader, { flexDirection: row }]}>
              <View style={styles.summaryIcon}><Ionicons name="receipt-outline" size={18} color="#D4AF37" /></View>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>{language === 'ar' ? 'ملخص الطلب' : 'Order summary'}</Text>
            </View>
            <View style={[styles.summaryRow, { flexDirection: row }]}><Text style={[styles.summaryLabel, { color: colors.muted }]}>{copy.subtotal}</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{cart.subtotal.toLocaleString('fr-DZ')} دج</Text></View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.note, { color: colors.muted, textAlign: align, writingDirection: direction }]}>{copy.deliveryNote}</Text>
          </View>

          <Pressable onPress={() => navigation.navigate('Checkout')} style={({ pressed }) => [styles.checkout, { flexDirection: row, opacity: pressed ? 0.86 : 1 }]}>
            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={19} color="#0B1833" />
            <Text style={styles.checkoutText}>{copy.continue}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('MyOrders')} style={({ pressed }) => [styles.ordersButton, { borderColor: colors.border, backgroundColor: colors.card, flexDirection: row, opacity: pressed ? 0.82 : 1 }]}>
            <Ionicons name="cube-outline" size={18} color="#B2871E" />
            <Text style={[styles.ordersText, { color: colors.text }]}>{copy.myOrders}</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  header: { alignItems: 'center', gap: 11 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 12 },
  empty: { borderWidth: 1, borderRadius: 24, padding: 28, gap: 10, alignItems: 'center' },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '900' },
  emptyBody: { textAlign: 'center', lineHeight: 21, fontSize: 13 },
  emptyButton: { marginTop: 4, minHeight: 44, borderRadius: 14, paddingHorizontal: 18, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  emptyButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 13 },
  list: { gap: 10 },
  item: { borderWidth: 1, borderRadius: 20, padding: 11, gap: 12 },
  thumb: { width: 88, height: 88, borderRadius: 15 },
  itemCopy: { flex: 1, gap: 7 },
  name: { fontWeight: '900', lineHeight: 21, fontSize: 14 },
  price: { fontWeight: '900', fontSize: 14.5 },
  controls: { alignItems: 'center', gap: 8 },
  stepper: { minHeight: 34, borderWidth: 1, borderRadius: 12, alignItems: 'center', overflow: 'hidden' },
  stepperButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '900' },
  remove: { padding: 7 },
  summary: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 10 },
  summaryHeader: { alignItems: 'center', gap: 8 },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontWeight: '900', fontSize: 15 },
  summaryRow: { justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontWeight: '700' },
  summaryValue: { fontWeight: '900', fontSize: 18 },
  divider: { height: StyleSheet.hairlineWidth },
  note: { fontSize: 11.5, lineHeight: 19 },
  checkout: { minHeight: 56, borderRadius: 17, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', gap: 8 },
  checkoutText: { color: '#0B1833', fontWeight: '900', fontSize: 15.5 },
  ordersButton: { minHeight: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ordersText: { fontWeight: '900', fontSize: 13.5 }
});