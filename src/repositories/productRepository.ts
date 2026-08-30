import { supabase } from '../services/supabase';

export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  images: string[] | null;
  stock: number | null;
  sales: number | null;
  benefits: string[] | null;
  badge: string | null;
  contents: string[] | null;
  level: string | null;
};

const selectFields = 'id,name,description,price,category,images,stock,sales,benefits,badge,contents,level';

export const productRepository = {
  async getAll() {
    return supabase.from('products').select(selectFields).order('created_at', { ascending: false });
  },

  async getById(id: number) {
    return supabase.from('products').select(selectFields).eq('id', id).single();
  }
};
