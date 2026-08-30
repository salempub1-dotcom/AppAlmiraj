import { supabase } from '../services/supabase';

export type CreateOrderInput = {
  customer: string;
  phone: string;
  wilaya: string;
  wilayaId: number;
  commune: string;
  address: string;
  deliveryType: 'home' | 'office';
  selectedOfficeId?: string | null;
  selectedOfficeName?: string | null;
  items: { productId: number; quantity: number }[];
};

export const orderRepository = {
  async create(input: CreateOrderInput) {
    return supabase.functions.invoke('app-create-order', { body: input });
  },

  async getMine() {
    return supabase
      .from('orders')
      .select('id,tracking,status,total,shipping,delivery_type,selected_office,delivery_status,delivery_status_updated_at,sent_to_delivery_at,created_at,items,wilaya,wilaya_id,commune,address')
      .eq('order_source', 'app')
      .order('created_at', { ascending: false });
  }
};
