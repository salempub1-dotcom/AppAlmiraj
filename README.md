# Al Miraj Education App

تطبيق موبايل للأساتذة تابع لـ **Al Miraj Education | المعراج للوسائل التعليمية**.

## الهدف
منصة يومية للأستاذ تجمع المحتوى المفيد، الأدوات، المستجدات، والمتجر مع الحفاظ على المحتوى المدفوع للمعراج خارج التطبيق.

## التقنية
- React Native + Expo SDK 57
- TypeScript
- Supabase Auth / Database
- React Navigation
- React Query

## حالة التطوير
- Phase 1: Foundation — تعمل على Android عبر Expo Go
- Phase 2: Home + Explore + Content Details — قيد التنفيذ النشط
- Phase 3: Store + Cart + Orders + Tracking
- Phase 4: Teacher Tools
- Phase 5: Community
- Phase 6: Notifications

## Phase 2 المنفذ حاليًا
- Home حديثة مع وصول سريع إلى استكشف
- Explore مع بحث وفلاتر حسب نوع المحتوى والمستوى
- أنواع المحتوى: فيديو، نصيحة، مشكلة وحل، فرض، اختبار، مورد، مقال، مستجد
- بطاقات محتوى موحدة
- صفحة تفاصيل مشتركة لكل أنواع المحتوى
- فتح روابط YouTube والموارد المجانية من صفحة التفاصيل
- Repository -> Hook -> Screen بدون استدعاء Supabase مباشرة من الشاشات
- RLS: القراءة العامة للمحتوى approved فقط

## قاعدة البيانات
يجب تطبيق migrations الموجودة داخل `supabase/migrations` على نفس مشروع Supabase المستعمل في الموقع والتطبيق قبل اختبار المحتوى الحي.

## تحديث النسخة على الهاتف
من جهاز التطوير:

```bash
cd ~/Documents/AppAlmiraj
git pull
npm install
npx expo start -c
```

`npm install` مطلوب فقط عندما تتغير dependencies.

> لا ترفع أي ملف `.env` أو مفاتيح سرية إلى GitHub.
