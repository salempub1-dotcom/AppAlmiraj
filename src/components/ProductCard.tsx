import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { useCart } from '../context/CartProvider';
import { useLanguage } from '../context/LanguageProvider';
import type { Product } from '../repositories/productRepository';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { colors } = useTheme();
  const cart = useCart();
  const { isRTL, language } = useLanguage();
  const align = isRTL ? 'right' : 'left';
  const image = product.images?.[0];

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={product.name} onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.surface }]}>
        {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <Ionicons name="image-outline" size={30} color={colors.muted} />}
        {!!product.badge && <Text style={[styles.badge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>{product.badge.trim()}</Text>}
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.name, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{product.name.trim()}</Text>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.muted, textAlign: align }]}>{[product.category, product.level].filter(Boolean).join(' • ')}</Text>
        <View style={[styles.bottomRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${language === 'ar' ? 'أضف إلى السلة' : 'Add to cart'}: ${product.name}`} onPress={(event) => { event.stopPropagation(); cart.add(product); }} style={[styles.add, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={23} color={colors.onPrimary} />
          </Pressable>
          <Text style={[styles.price, { color: colors.text }]}>{product.price.toLocaleString('fr-DZ')} {language === 'ar' ? 'دج' : 'DZD'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  imageWrap: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 9, right: 9, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, fontSize: 10, fontWeight: '900' },
  copy: { padding: 12, gap: 7 },
  name: { textAlign: 'right', writingDirection: 'rtl', fontSize: 15, lineHeight: 22, fontWeight: '900', minHeight: 44 },
  meta: { textAlign: 'right', fontSize: 11.5 },
  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontWeight: '800', fontSize: 14, flexShrink: 1 },
  add: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }
});
