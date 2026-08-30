import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useTheme } from '../../../context/ThemeProvider';

export function CartScreen() {
  const { colors } = useTheme();
  const cart = useCart();

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.surface }]}><Ionicons name="bag-handle-outline" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>سلة الطلب</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{cart.count} منتج</Text>
        </View>
      </View>

      {cart.items.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="bag-outline" size={42} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>السلة فارغة</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>أضف منتجات من متجر المعراج وستظهر هنا.</Text>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {cart.items.map(({ product, quantity }) => (
              <View key={product.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                {product.images?.[0] ? <Image source={{ uri: product.images[0] }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: colors.surface }]} />}
                <View style={styles.itemCopy}>
                  <Text numberOfLines={2} style={[styles.name, { color: colors.text }]}>{product.name.trim()}</Text>
                  <Text style={[styles.price, { color: colors.text }]}>{(product.price * quantity).toLocaleString('fr-DZ')} دج</Text>
                  <View style={styles.controls}>
                    <Pressable onPress={() => cart.increment(product.id)} style={[styles.circle, { borderColor: colors.border }]}><Ionicons name="add" size={18} color={colors.text} /></Pressable>
                    <Text style={[styles.qty, { color: colors.text }]}>{quantity}</Text>
                    <Pressable onPress={() => cart.decrement(product.id)} style={[styles.circle, { borderColor: colors.border }]}><Ionicons name="remove" size={18} color={colors.text} /></Pressable>
                    <Pressable onPress={() => cart.remove(product.id)} style={styles.remove}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.muted }]}>المجموع المؤقت</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{cart.subtotal.toLocaleString('fr-DZ')} دج</Text></View>
            <Text style={[styles.note, { color: colors.muted }]}>سعر التوصيل يُحسب لاحقًا حسب الولاية ونوع التوصيل.</Text>
          </View>

          <Pressable style={[styles.checkout, { backgroundColor: colors.primary }]}>
            <Ionicons name="arrow-back" size={20} color={colors.onPrimary} />
            <Text style={[styles.checkoutText, { color: colors.onPrimary }]}>متابعة الطلب</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'right' },
  subtitle: { fontSize: 12 },
  empty: { borderWidth: 1, borderRadius: 24, padding: 30, gap: 10, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '900' },
  emptyBody: { textAlign: 'center' },
  list: { gap: 12 },
  item: { borderWidth: 1, borderRadius: 20, padding: 12, flexDirection: 'row-reverse', gap: 12 },
  thumb: { width: 92, height: 92, borderRadius: 16 },
  itemCopy: { flex: 1, gap: 7 },
  name: { textAlign: 'right', writingDirection: 'rtl', fontWeight: '900', lineHeight: 21 },
  price: { textAlign: 'right', fontWeight: '900' },
  controls: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  circle: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20, textAlign: 'center', fontWeight: '900' },
  remove: { marginRight: 'auto', padding: 7 },
  summary: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 9 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontWeight: '700' },
  summaryValue: { fontWeight: '900', fontSize: 18 },
  note: { textAlign: 'right', writingDirection: 'rtl', fontSize: 12, lineHeight: 20 },
  checkout: { minHeight: 58, borderRadius: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9 },
  checkoutText: { fontWeight: '900', fontSize: 16 }
});
