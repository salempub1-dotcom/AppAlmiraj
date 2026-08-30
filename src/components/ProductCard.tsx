import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { useCart } from '../context/CartProvider';
import type { Product } from '../repositories/productRepository';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { colors } = useTheme();
  const cart = useCart();
  const image = product.images?.[0];

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={[styles.imageWrap, { backgroundColor: colors.surface }]}> 
        {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <Ionicons name="image-outline" size={30} color={colors.muted} />}
        {!!product.badge && <Text style={[styles.badge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>{product.badge.trim()}</Text>}
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.name, { color: colors.text }]}>{product.name.trim()}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{[product.category, product.level].filter(Boolean).join(' • ')}</Text>
        <View style={styles.bottomRow}>
          <Pressable onPress={(event) => { event.stopPropagation(); cart.add(product); }} style={[styles.add, { backgroundColor: colors.primary }]}> 
            <Ionicons name="bag-add-outline" size={18} color={colors.onPrimary} />
          </Pressable>
          <Text style={[styles.price, { color: colors.text }]}>{product.price.toLocaleString('fr-DZ')} دج</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  imageWrap: { height: 150, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 9, right: 9, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, fontSize: 10, fontWeight: '900' },
  copy: { padding: 12, gap: 7 },
  name: { textAlign: 'right', writingDirection: 'rtl', fontSize: 15, lineHeight: 22, fontWeight: '900', minHeight: 44 },
  meta: { textAlign: 'right', fontSize: 11.5 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  price: { fontWeight: '900', fontSize: 15 },
  add: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});
