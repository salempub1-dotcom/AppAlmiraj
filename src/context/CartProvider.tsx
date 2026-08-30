import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '../repositories/productRepository';

export type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const STORAGE_KEY = 'al-miraj-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => value && setItems(JSON.parse(value)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items]);

  const add = (product: Product) => {
    setItems((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (found) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { product, quantity: 1 }];
    });
  };

  const increment = (productId: number) => setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item));
  const decrement = (productId: number) => setItems((current) => current.flatMap((item) => item.product.id === productId ? (item.quantity <= 1 ? [] : [{ ...item, quantity: item.quantity - 1 }]) : [item]));
  const remove = (productId: number) => setItems((current) => current.filter((item) => item.product.id !== productId));
  const clear = () => setItems([]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    add,
    increment,
    decrement,
    remove,
    clear
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider');
  return value;
}
