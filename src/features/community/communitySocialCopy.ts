export type CommunitySocialLanguage = 'ar' | 'en';

const socialCopy = {
  ar: {
    communityLabel: 'مجتمع الأساتذة',
    composerPrompt: 'ماذا تريد أن تشارك مع زملائك اليوم؟',
    quickIdea: 'فكرة',
    quickQuestion: 'سؤال',
    quickImage: 'صورة',
    quickPdf: 'PDF',
    filters: {
      all: 'الكل',
      idea: 'أفكار',
      question: 'أسئلة',
      test: 'فروض',
      exam: 'اختبارات',
      resource: 'موارد',
      classroom_experience: 'تجارب',
      tip: 'نصائح'
    }
  },
  en: {
    communityLabel: 'Teacher community',
    composerPrompt: 'What would you like to share with your colleagues today?',
    quickIdea: 'Idea',
    quickQuestion: 'Question',
    quickImage: 'Photo',
    quickPdf: 'PDF',
    filters: {
      all: 'All',
      idea: 'Ideas',
      question: 'Questions',
      test: 'Tests',
      exam: 'Exams',
      resource: 'Resources',
      classroom_experience: 'Experiences',
      tip: 'Tips'
    }
  }
} as const;

export function getCommunitySocialCopy(language: string) {
  return language === 'en' ? socialCopy.en : socialCopy.ar;
}
