import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'ar' | 'en';
type TranslationTree = Record<string, string | TranslationTree>;
const STORAGE_KEY = 'al-miraj-language';

const translations: Record<AppLanguage, TranslationTree> = {
  ar: {
    nav: { home: 'الرئيسية', explore: 'استكشف', tools: 'الأدوات', store: 'المتجر', profile: 'حسابي' },
    common: { arabic: 'العربية', english: 'English', openTool: 'فتح الأداة' },
    home: {
      brand: 'المعراج', daily: 'منصة الأستاذ اليومية', heroTitle: 'كل ما تحتاجه في يومك المهني، في مكان واحد.', heroBody: 'محتوى عملي، موارد مجانية وأدوات تساعدك على التحضير وإدارة القسم بكفاءة أكبر.', explore: 'استكشف المحتوى',
      seeAll: 'عرض الكل', quickTitle: 'وصول سريع', quickCaption: 'اختصر الطريق إلى ما تحتاجه', videos: 'فيديوهات تعليمية', videosSub: 'شرح وأفكار جاهزة للقسم', tests: 'فروض واختبارات', testsSub: 'موارد مجانية ومنظمة', problems: 'مشاكل وحلول', problemsSub: 'حلول عملية لمواقف يومية', tips: 'نصائح للأستاذ', tipsSub: 'أفكار قصيرة قابلة للتطبيق',
      refresh: 'تحديث', newTitle: 'جديد المعراج', newCaption: 'أحدث ما نُشر للأساتذة', loadError: 'تعذر تحميل المحتوى', loadErrorText: 'تحقق من الاتصال ثم اضغط تحديث.', preparing: 'المحتوى قيد التجهيز', preparingText: 'سيظهر هنا أحدث المحتوى المجاني فور نشره من المعراج.', trusted: 'منصة تعليمية موثوقة', trustedText: 'المحتوى المجاني هنا منفصل عن منتجات المعراج المدفوعة، لضمان قيمة واضحة وآمنة للأستاذ.'
    },
    profile: {
      title: 'حسابي', subtitle: 'إعداداتك وبياناتك في مكان واحد', welcome: 'مرحبًا بك في المعراج', guestText: 'يمكنك التصفح كزائر، لكن الحفظ والطلبات والتفضيلات الشخصية تحتاج حسابًا.', signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب جديد', teacherAccount: 'حساب الأستاذ', editProfile: 'تعديل الملف الشخصي', editProfileText: 'الاسم، المادة، المستوى والولاية', orders: 'طلباتي', ordersText: 'طلباتك وحالة التوصيل في مكان واحد', appearance: 'المظهر', appearanceText: 'اختر الوضع الذي يناسبك أثناء الاستخدام', system: 'النظام', dark: 'داكن', light: 'فاتح', language: 'اللغة', languageText: 'اختر لغة واجهة التطبيق', signOut: 'تسجيل الخروج'
    },
    tools: {
      heroTitle: 'أدوات الأستاذ', heroBody: 'أدوات صغيرة وسريعة تساعدك أثناء الحصة، وتعمل دون الحاجة إلى اتصال مستمر بالإنترنت.', ready: 'جاهزة للتجربة', sectionTitle: 'أدوات البداية', sectionCaption: 'ثلاث أدوات عملية للاستخدام المباشر داخل القسم', timerTitle: 'مؤقت القسم', timerText: 'مؤقت واضح للأنشطة، التحديات والعمل الجماعي.', timerDone: 'انتهى الوقت', timerRunning: 'المؤقت يعمل الآن', timerReady: 'جاهز للبدء', timerMinute: 'د', timerPause: 'إيقاف مؤقت', timerStart: 'ابدأ', timerReset: 'إعادة الضبط', randomTitle: 'اختيار تلميذ عشوائي', randomText: 'اختيار سريع وعادل أثناء المشاركة داخل القسم.', randomCaption: 'أدخل الأسماء كل اسم في سطر، ثم اضغط اختيار.', randomPlaceholder: 'مثال:\nأحمد\nسارة\nيوسف', studentCount: 'عدد التلاميذ', selected: 'تم الاختيار', pickNow: 'اختيار الآن', groupsTitle: 'تقسيم المجموعات', groupsText: 'إنشاء مجموعات عشوائية بسرعة وبدون تعقيد.', groupsCaption: 'ألصق قائمة التلاميذ وسيتم توزيعهم عشوائيًا وبشكل متوازن.', groupsPlaceholder: 'أدخل الأسماء، كل اسم في سطر', groupCount: 'عدد المجموعات', splitNow: 'قسّم الآن', group: 'المجموعة', offlineTitle: 'مناسبة للاستخدام داخل القسم', offlineText: 'الأدوات الثلاث تعمل محليًا داخل التطبيق ولا تحتاج إلى قاعدة البيانات أثناء الاستخدام.'
    }
  },
  en: {
    nav: { home: 'Home', explore: 'Explore', tools: 'Tools', store: 'Store', profile: 'Profile' },
    common: { arabic: 'العربية', english: 'English', openTool: 'Open tool' },
    home: {
      brand: 'Al Miraj', daily: 'Your daily teacher platform', heroTitle: 'Everything you need for your teaching day, in one place.', heroBody: 'Practical content, free resources and tools to help you prepare lessons and manage your classroom more efficiently.', explore: 'Explore content',
      seeAll: 'See all', quickTitle: 'Quick access', quickCaption: 'Get to what you need faster', videos: 'Educational Videos', videosSub: 'Explanations and ready classroom ideas', tests: 'Tests & Exams', testsSub: 'Free, organized resources', problems: 'Problems & Solutions', problemsSub: 'Practical solutions for daily situations', tips: 'Teacher Tips', tipsSub: 'Short, actionable ideas',
      refresh: 'Refresh', newTitle: 'New from Al Miraj', newCaption: 'Latest content published for teachers', loadError: 'Could not load content', loadErrorText: 'Check your connection, then tap Refresh.', preparing: 'Content is being prepared', preparingText: 'The latest free content will appear here as soon as it is published.', trusted: 'A trusted education platform', trustedText: 'Free content is kept separate from paid Al Miraj products to preserve clear value for teachers.'
    },
    profile: {
      title: 'My Profile', subtitle: 'Your settings and information in one place', welcome: 'Welcome to Al Miraj', guestText: 'You can browse as a guest, but saving, orders and personal preferences require an account.', signIn: 'Sign in', signUp: 'Create account', teacherAccount: 'Teacher account', editProfile: 'Edit profile', editProfileText: 'Name, subject, level and wilaya', orders: 'My Orders', ordersText: 'Your orders and delivery status in one place', appearance: 'Appearance', appearanceText: 'Choose the display mode that suits you', system: 'System', dark: 'Dark', light: 'Light', language: 'Language', languageText: 'Choose the app interface language', signOut: 'Sign out'
    },
    tools: {
      heroTitle: 'Teacher Tools', heroBody: 'Small, fast tools that help during class and work without a constant internet connection.', ready: 'Ready to try', sectionTitle: 'Starter tools', sectionCaption: 'Three practical tools for direct classroom use', timerTitle: 'Class Timer', timerText: 'A clear timer for activities, challenges and group work.', timerDone: 'Time is up', timerRunning: 'Timer is running', timerReady: 'Ready to start', timerMinute: 'min', timerPause: 'Pause', timerStart: 'Start', timerReset: 'Reset', randomTitle: 'Random Student Picker', randomText: 'A quick and fair way to choose students during participation.', randomCaption: 'Enter one student name per line, then tap Pick.', randomPlaceholder: 'Example:\nAhmed\nSara\nYoucef', studentCount: 'Students', selected: 'Selected', pickNow: 'Pick now', groupsTitle: 'Group Maker', groupsText: 'Create balanced random groups quickly and easily.', groupsCaption: 'Paste the student list and they will be distributed randomly and evenly.', groupsPlaceholder: 'Enter one name per line', groupCount: 'Number of groups', splitNow: 'Create groups', group: 'Group', offlineTitle: 'Built for classroom use', offlineText: 'All three tools run locally in the app and do not need the database while in use.'
    }
  }
};

function getNested(tree: TranslationTree, key: string): string | undefined {
  const value = key.split('.').reduce<string | TranslationTree | undefined>((acc, part) => {
    if (!acc || typeof acc === 'string') return undefined;
    return acc[part];
  }, tree);
  return typeof value === 'string' ? value : undefined;
}

type LanguageContextValue = { language: AppLanguage; isRTL: boolean; setLanguage: (language: AppLanguage) => Promise<void>; t: (key: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<AppLanguage>('ar');
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((saved) => { if (saved === 'ar' || saved === 'en') setLanguageState(saved); }).finally(() => setReady(true)); }, []);
  const setLanguage = async (next: AppLanguage) => { setLanguageState(next); await AsyncStorage.setItem(STORAGE_KEY, next); };
  const value = useMemo<LanguageContextValue>(() => ({ language, isRTL: language === 'ar', setLanguage, t: (key: string) => getNested(translations[language], key) ?? getNested(translations.ar, key) ?? key }), [language]);
  if (!ready) return null;
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
