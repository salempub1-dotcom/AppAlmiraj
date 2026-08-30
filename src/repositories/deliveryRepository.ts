const DELIVERY_API = 'https://www.elm3raj.com/api/noest';
const TRACKING_API = 'https://www.elm3raj.com/api/track-order';

async function post(body: Record<string, unknown>) {
  const response = await fetch(DELIVERY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({ ok: false, error: 'INVALID_RESPONSE' }));
  return { response, result };
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>);
  return [];
}

export type WilayaOption = { id: number; name: string };
export type CommuneOption = { name: string };
export type PickupHub = { id: string; name: string; cityName?: string; communeName?: string; address?: string };
export type ShippingQuote = { home: number | null; office: number | null };

export const deliveryRepository = {
  async getWilayas(): Promise<{ data: WilayaOption[]; error: Error | null }> {
    try {
      const { result } = await post({ action: 'get_wilayas' });
      if (!result?.ok) throw new Error(result?.message || result?.error || 'تعذر تحميل الولايات.');
      const data = normalizeArray(result.data).map((item: any) => ({
        id: Number(item?.id ?? item?.wilaya_id ?? item?.code ?? 0),
        name: String(item?.name ?? item?.wilaya_name ?? item?.nom ?? item?.name_ar ?? '').trim()
      })).filter((item) => item.id > 0 && item.name);
      return { data, error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('تعذر تحميل الولايات.') };
    }
  },

  async getCommunes(wilayaId: number): Promise<{ data: CommuneOption[]; error: Error | null }> {
    try {
      const { result } = await post({ action: 'get_communes', wilaya_id: wilayaId });
      if (!result?.ok) throw new Error(result?.message || result?.error || 'تعذر تحميل البلديات.');
      const data = normalizeArray(result.data).map((item: any) => ({
        name: String(item?.name ?? item?.commune_name ?? item?.nom ?? item?.name_ar ?? '').trim()
      })).filter((item) => item.name);
      return { data, error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('تعذر تحميل البلديات.') };
    }
  },

  async getQuote(wilayaId: number, commune: string): Promise<{ data: ShippingQuote | null; error: Error | null }> {
    try {
      const { result } = await post({ action: 'checkout_zr_quote', wilaya_id: wilayaId, commune });
      if (!result?.ok || !result?.data) throw new Error(result?.message || 'تعذر حساب سعر التوصيل.');
      return { data: { home: result.data.home ?? null, office: result.data.office ?? null }, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('تعذر حساب سعر التوصيل.') };
    }
  },

  async getPickupHubs(wilayaId: number, commune: string): Promise<{ data: PickupHub[]; error: Error | null }> {
    try {
      const { result } = await post({ action: 'checkout_zr_options', wilaya_id: wilayaId, commune });
      if (!result?.ok || !result?.data) throw new Error(result?.message || 'تعذر تحميل المكاتب.');
      const data = normalizeArray(result.data.pickup_hubs).map((hub: any) => ({
        id: String(hub?.id ?? ''),
        name: String(hub?.name ?? '').trim(),
        cityName: hub?.cityName ? String(hub.cityName) : undefined,
        communeName: hub?.communeName ? String(hub.communeName) : undefined,
        address: hub?.address ? String(hub.address) : undefined
      })).filter((hub) => hub.id && hub.name);
      return { data, error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('تعذر تحميل المكاتب.') };
    }
  },

  async track(orderNumber: string) {
    try {
      const response = await fetch(`${TRACKING_API}?order_number=${encodeURIComponent(orderNumber)}`);
      const result = await response.json().catch(() => ({ ok: false }));
      if (!result?.ok) throw new Error(result?.message || 'تعذر تحميل حالة التوصيل.');
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('تعذر تحميل حالة التوصيل.') };
    }
  }
};
