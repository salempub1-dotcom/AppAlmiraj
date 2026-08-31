import type { AppLanguage } from '../context/LanguageProvider';
import type { CommunityPostType } from '../repositories/communityRepository';

// Teacher Space ("فضاء الأستاذ") bilingual copy. Kept as its own file,
// separate from the central LanguageProvider translation tree, mirroring
// the existing adminCopy.ts pattern used by the Content Manager.

export const communityCopy = {
  ar: {
    nav: {
      feed: 'فضاء الأستاذ',
      detail: 'المنشور',
      create: 'منشور جديد',
      profile: 'الملف الشخصي'
    },
    entry: {
      title: 'فضاء الأستاذ',
      subtitle: 'تواصل مع الأساتذة، شارك أفكارك وموارد قسمك'
    },
    feed: {
      title: 'فضاء الأستاذ',
      subtitle: 'مساحة تواصل تعليمية بين الأساتذة',
      newPost: 'منشور جديد',
      loading: 'جارٍ تحميل المنشورات...',
      loadMore: 'تحميل المزيد',
      loadingMore: 'جارٍ التحميل...',
      loadError: 'تعذر تحميل فضاء الأستاذ',
      loadErrorText: 'تحقق من الاتصال ثم أعد المحاولة.',
      retry: 'إعادة المحاولة',
      emptyTitle: 'لا توجد منشورات بعد',
      emptyText: 'كن أول من يشارك فكرة أو مورد مع بقية الأساتذة.',
      guestTitle: 'فضاء الأستاذ للأساتذة المسجلين فقط',
      guestText: 'سجّل الدخول بحسابك كأستاذ للاطلاع على المنشورات والمشاركة معها.',
      signIn: 'تسجيل الدخول'
    },
    card: {
      openPdf: 'فتح ملف PDF',
      viewDetails: 'عرض التفاصيل',
      likes: 'إعجاب',
      comments: 'تعليق',
      saves: 'حفظ'
    },
    detail: {
      loading: 'جاري فتح المنشور...',
      loadError: 'تعذر فتح المنشور',
      loadErrorText: 'قد يكون المنشور غير متاح أو تم حذفه.',
      retry: 'إعادة المحاولة',
      attachment: 'المرفق',
      openImage: 'عرض الصورة',
      openPdf: 'فتح ملف PDF',
      about: 'عن الأستاذ',
      viewProfile: 'عرض الملف الشخصي',
      interactionsSoon: 'الإعجاب والتعليق والحفظ قريبًا'
    },
    form: {
      title: 'منشور جديد',
      postType: 'نوع المنشور',
      titleField: 'العنوان (اختياري)',
      titleOptional: 'عنوان مختصر للمنشور (اختياري)',
      body: 'النص',
      bodyPlaceholder: 'اكتب فكرتك، سؤالك أو تجربتك مع بقية الأساتذة...',
      subject: 'المادة',
      level: 'المستوى الدراسي',
      attachment: 'مرفق (اختياري)',
      addImage: 'إضافة صورة',
      addPdf: 'إضافة ملف PDF',
      changeAttachment: 'تغيير المرفق',
      removeAttachment: 'إزالة المرفق',
      uploading: 'جارٍ رفع المرفق...',
      publishing: 'جارٍ النشر...',
      publish: 'نشر',
      validationEmpty: 'أضف نصًا أو مرفقًا قبل النشر',
      validationMimeImage: 'صيغة الصورة غير مدعومة. يُسمح فقط بـ JPG أو PNG أو WEBP أو HEIC.',
      validationMimePdf: 'الملف يجب أن يكون بصيغة PDF.',
      validationSizeImage: 'حجم الصورة كبير جدًا. الحد الأقصى 2 ميغابايت.',
      validationSizePdf: 'حجم الملف كبير جدًا. الحد الأقصى 10 ميغابايت.',
      permissionError: 'يلزم صلاحية الوصول للصور/الملفات',
      publishError: 'تعذر نشر المحتوى. حاول مرة أخرى.',
      uploadError: 'تعذر رفع المرفق'
    },
    profile: {
      loading: 'جاري تحميل الملف الشخصي...',
      loadError: 'تعذر تحميل الملف الشخصي',
      loadErrorText: 'قد يكون هذا الملف الشخصي غير متاح.',
      followers: 'متابع',
      following: 'يتابع',
      posts: 'منشور',
      postsTitle: 'منشورات هذا الأستاذ',
      noPosts: 'لا توجد منشورات منشورة بعد'
    },
    types: {
      text: 'منشور نصي',
      image: 'صورة',
      pdf: 'ملف PDF',
      question: 'سؤال',
      idea: 'فكرة',
      exam: 'اختبار',
      test: 'فرض',
      resource: 'مورد',
      classroom_experience: 'تجربة صفية',
      tip: 'نصيحة'
    } satisfies Record<CommunityPostType, string>
  },
  en: {
    nav: {
      feed: 'Teacher Space',
      detail: 'Post',
      create: 'New post',
      profile: 'Profile'
    },
    entry: {
      title: 'Teacher Space',
      subtitle: 'Connect with teachers, share ideas and classroom resources'
    },
    feed: {
      title: 'Teacher Space',
      subtitle: 'An educational community for teachers',
      newPost: 'New post',
      loading: 'Loading posts...',
      loadMore: 'Load more',
      loadingMore: 'Loading...',
      loadError: 'Could not load Teacher Space',
      loadErrorText: 'Check your connection and try again.',
      retry: 'Retry',
      emptyTitle: 'No posts yet',
      emptyText: 'Be the first to share an idea or resource with other teachers.',
      guestTitle: 'Teacher Space is for signed-in teachers only',
      guestText: 'Sign in with your teacher account to browse and join the community.',
      signIn: 'Sign in'
    },
    card: {
      openPdf: 'Open PDF',
      viewDetails: 'View details',
      likes: 'likes',
      comments: 'comments',
      saves: 'saves'
    },
    detail: {
      loading: 'Opening post...',
      loadError: 'Could not open this post',
      loadErrorText: 'This post may be unavailable or has been removed.',
      retry: 'Try again',
      attachment: 'Attachment',
      openImage: 'View image',
      openPdf: 'Open PDF',
      about: 'About the teacher',
      viewProfile: 'View profile',
      interactionsSoon: 'Likes, comments and saves are coming soon'
    },
    form: {
      title: 'New post',
      postType: 'Post type',
      titleField: 'Title (optional)',
      titleOptional: 'A short title for your post (optional)',
      body: 'Body',
      bodyPlaceholder: 'Share your idea, question or classroom experience with other teachers...',
      subject: 'Subject',
      level: 'Educational level',
      attachment: 'Attachment (optional)',
      addImage: 'Add image',
      addPdf: 'Add PDF',
      changeAttachment: 'Change attachment',
      removeAttachment: 'Remove attachment',
      uploading: 'Uploading attachment...',
      publishing: 'Publishing...',
      publish: 'Publish',
      validationEmpty: 'Add some text or an attachment before publishing',
      validationMimeImage: 'Unsupported image format. Only JPG, PNG, WEBP or HEIC are allowed.',
      validationMimePdf: 'The file must be a PDF.',
      validationSizeImage: 'Image is too large. Maximum size is 2 MB.',
      validationSizePdf: 'File is too large. Maximum size is 10 MB.',
      permissionError: 'Photo/file access permission is required',
      publishError: 'Could not publish this post. Please try again.',
      uploadError: 'Could not upload the attachment'
    },
    profile: {
      loading: 'Loading profile...',
      loadError: 'Could not load this profile',
      loadErrorText: 'This profile may not be available.',
      followers: 'Followers',
      following: 'Following',
      posts: 'Posts',
      postsTitle: "This teacher's posts",
      noPosts: 'No published posts yet'
    },
    types: {
      text: 'Text post',
      image: 'Image',
      pdf: 'PDF',
      question: 'Question',
      idea: 'Idea',
      exam: 'Exam',
      test: 'Test',
      resource: 'Resource',
      classroom_experience: 'Classroom experience',
      tip: 'Tip'
    } satisfies Record<CommunityPostType, string>
  }
} satisfies Record<AppLanguage, any>;

export function getCommunityCopy(language: AppLanguage) {
  return communityCopy[language];
}
