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

const STORE_PRODUCTS_API = 'https://www.elm3raj.com/api/products';

type RepositoryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

async function fetchProducts(): Promise<RepositoryResult<Product[]>> {
  try {
    const response = await fetch(STORE_PRODUCTS_API, {
      headers: { Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
      return {
        data: null,
        error: { message: payload?.error || 'تعذر تحميل المنتجات من المتجر.' }
      };
    }

    return { data: payload.data as Product[], error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'تعذر الاتصال بالمتجر.' }
    };
  }
}

export const productRepository = {
  async getAll(): Promise<RepositoryResult<Product[]>> {
    const result = await fetchProducts();
    if (result.data) {
      result.data = [...result.data].sort((a, b) => Number(b.id) - Number(a.id));
    }
    return result;
  },

  async getById(id: number): Promise<RepositoryResult<Product>> {
    const result = await fetchProducts();
    if (result.error || !result.data) return { data: null, error: result.error };

    const product = result.data.find((item) => Number(item.id) === Number(id)) || null;
    return product
      ? { data: product, error: null }
      : { data: null, error: { message: 'المنتج غير موجود.' } };
  }
};
