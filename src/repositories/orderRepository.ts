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

const STORE_APP_ORDERS_API = 'https://www.elm3raj.com/api/app-orders';

type RepositoryError = { message: string };

type RepositoryResult<T> = {
  data: T | null;
  error: RepositoryError | null;
};

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { token: null, error: { message: error.message } };
  const token = data.session?.access_token || null;
  return token
    ? { token, error: null }
    : { token: null, error: { message: 'يجب تسجيل الدخول أولًا.' } };
}

async function callStore<T>(body: Record<string, unknown>): Promise<RepositoryResult<T>> {
  const auth = await getAccessToken();
  if (!auth.token) return { data: null, error: auth.error };

  try {
    const response = await fetch(STORE_APP_ORDERS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.error) {
      return {
        data: null,
        error: { message: payload?.error || 'تعذر الاتصال بخدمة الطلبات.' },
      };
    }

    return { data: payload as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'تعذر الاتصال بخدمة الطلبات.' },
    };
  }
}

export const orderRepository = {
  async create(input: CreateOrderInput) {
    const result = await callStore<{ order: unknown; shippingPending: boolean }>({
      action: 'create',
      ...input,
    });

    if (result.error) return { data: null, error: result.error };
    return { data: result.data, error: null };
  },

  async getMine() {
    const result = await callStore<{ data: unknown[] }>({ action: 'list' });
    if (result.error) return { data: null, error: result.error };
    return { data: result.data?.data || [], error: null };
  },
};
