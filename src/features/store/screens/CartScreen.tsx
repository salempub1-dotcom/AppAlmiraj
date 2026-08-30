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
        <View style={[styles.iconBox, { backgroundColor: colors.surface }]}><Ionicons name="bag-handle-outline" size={24} color={colors.primary} /></View>
        <View style={[styles.headerCopy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{cart.count} {cart.count === 1 ? copy.item : copy.items}</Text>
        </View>
      </View>

      {cart.items.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="bag-outline" size={42} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{copy.emptyTitle}</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>{copy.emptyBody}</Text>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {cart.items.map(({ product, quantity }) => (
              <View key={product.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
                {product.images?.[0] ? <Image source={{ uri: product.images[0] }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: colors.surface }]} />}
                <View style={styles.itemCopy}>
                  <Text numberOfLines={2} style={[styles.name, { color: colors.text, textAlign: align, writingDirection: direction }]}>{product.name.trim()}</Text>
                  <Text style={[styles.price, { color: colors.text, textAlign: align }]}>{(product.price * quantity).toLocaleString('fr-DZ')} دج</Text>
                  <View style={[styles.controls, { flexDirection: row }]}>
                    <Pressable onPress={() => cart.increment(product.id)} style={[styles.circle, { borderColor: colors.border }]}><Ionicons name="add" size={18} color={colors.text} /></Pressable>
                    <Text style={[styles.qty, { color: colors.text }]}>{quantity}</Text>
                    <Pressable onPress={() => cart.decrement(product.id)} style={[styles.circle, { borderColor: colors.border }]}><Ionicons name="remove" size={18} color={colors.text} /></Pressable>
                    <Pressable onPress={() => cart.remove(product.id)} style={[styles.remove, { marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }]}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.summaryRow, { flexDirection: row }]}><Text style={[styles.summaryLabel, { color: colors.muted }]}>{copy.subtotal}</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{cart.subtotal.toLocaleString('fr-DZ')} دج</Text></View>
            <Text style={[styles.note, { color: colors.muted, textAlign: align, writingDirection: direction }]}>{copy.deliveryNote}</Text>
          </View>

          <Pressable onPress={() => navigation.navigate('Checkout')} style={[styles.checkout, { backgroundColor: colors.primary, flexDirection: row }]}>
            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={colors.onPrimary} />
            <Text style={[styles.checkoutText, { color: colors.onPrimary }]}>{copy.continue}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('MyOrders')} style={[styles.ordersButton, { borderColor: colors.border, backgroundColor: colors.card, flexDirection: row }]}>
            <Ionicons name="cube-outline" size={19} color={colors.primary} />
            <Text style={[styles.ordersText, { color: colors.text }]}>{copy.myOrders}</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  header: { alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 12 },
  empty: { borderWidth: 1, borderRadius: 24, padding: 30, gap: 10, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '900' },
  emptyBody: { textAlign: 'center' },
  list: { gap: 12 },
  item: { borderWidth: 1, borderRadius: 20, padding: 12, gap: 12 },
  thumb: { width: 92, height: 92, borderRadius: 16 },
  itemCopy: { flex: 1, gap: 7 },
  name: { fontWeight: '900', lineHeight: 21 },
  price: { fontWeight: '900' },
  controls: { alignItems: 'center', gap: 8 },
  circle: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20, textAlign: 'center', fontWeight: '900' },
  remove: { padding: 7 },
  summary: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 9 },
  summaryRow: { justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontWeight: '700' },
  summaryValue: { fontWeight: '900', fontSize: 18 },
  note: { fontSize: 12, lineHeight: 20 },
  checkout: { minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 9 },
  checkoutText: { fontWeight: '900', fontSize: 16 },
  ordersButton: { minHeight: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ordersText: { fontWeight: '900' }
});
