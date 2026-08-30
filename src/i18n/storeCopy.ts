import type { AppLanguage } from '../context/LanguageProvider';

export const storeCopy = {
  ar: {
    nav: {
      productDetail: 'تفاصيل المنتج',
      cart: 'سلة الطلب',
      checkout: 'إتمام الطلب',
      orders: 'طلباتي',
      orderDetail: 'تفاصيل الطلب'
    },
    product: {
      loadError: 'تعذر فتح المنتج',
      benefits: 'المميزات',
      buyNow: 'اطلب الآن',
      addToCart: 'أضف إلى السلة',
      actionHint: 'يمكنك الطلب مباشرة أو إضافة المنتج للسلة ومتابعة التسوق.'
    },
    cart: {
      title: 'سلة الطلب',
      item: 'منتج',
      items: 'منتجات',
      emptyTitle: 'السلة فارغة',
      emptyBody: 'أضف منتجات من متجر المعراج وستظهر هنا.',
      subtotal: 'المجموع المؤقت',
      deliveryNote: 'سيتم حساب سعر التوصيل في الخطوة التالية حسب الولاية والبلدية ونوع التوصيل.',
      continue: 'متابعة الطلب',
      myOrders: 'عرض طلباتي'
    }
  },
  en: {
    nav: {
      productDetail: 'Product Details',
      cart: 'Cart',
      checkout: 'Checkout',
      orders: 'My Orders',
      orderDetail: 'Order Details'
    },
    product: {
      loadError: 'Could not open product',
      benefits: 'Features',
      buyNow: 'Order now',
      addToCart: 'Add to cart',
      actionHint: 'Order now or add the product to your cart and keep shopping.'
    },
    cart: {
      title: 'Cart',
      item: 'item',
      items: 'items',
      emptyTitle: 'Your cart is empty',
      emptyBody: 'Add products from Al Miraj Store and they will appear here.',
      subtotal: 'Subtotal',
      deliveryNote: 'Delivery price will be calculated in the next step based on wilaya, commune and delivery type.',
      continue: 'Continue to checkout',
      myOrders: 'View my orders'
    }
  }
} satisfies Record<AppLanguage, any>;

export function getStoreCopy(language: AppLanguage) {
  return storeCopy[language];
}
