import { useQuery } from '@tanstack/react-query';
import { productRepository } from '../repositories/productRepository';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await productRepository.getAll();
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useProductDetail(id: number) {
  return useQuery({
    queryKey: ['products', id],
    enabled: Number.isFinite(id),
    queryFn: async () => {
      const { data, error } = await productRepository.getById(id);
      if (error) throw error;
      return data;
    }
  });
}
