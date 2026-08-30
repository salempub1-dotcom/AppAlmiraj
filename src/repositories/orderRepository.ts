import { supabase } from '../services/supabase';

export type CreateOrderInput = {
  customer: string;
  phone: string;
  wilaya: string;
  commune?: string;
  address: string;
  deliveryType: 'home' | 'office';
  selectedOffice?: string | null;
  items: { productId: number; quantity: number }[];
};

export const orderRepository = {
  async create(input: CreateOrderInput) {
    return supabase.functions.invoke('app-create-order', { body: input });
  },

  async getMine() {
    return supabase
      .from('orders')
      .select('id,status,total,shipping,delivery_type,delivery_status,created_at,items,wilaya,commune,address')
      .eq('order_source', 'app')
      .order('created_at', { ascending: false });
  }
};
