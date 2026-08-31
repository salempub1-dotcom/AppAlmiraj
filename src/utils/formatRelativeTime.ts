import type { AppLanguage } from '../context/LanguageProvider';

// Small self-contained "x minutes/hours/days ago" formatter - no new
// dependency needed for a single display helper used only by Teacher Space.
export function formatRelativeTime(isoDate: string, language: AppLanguage): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return language === 'ar' ? 'الآن' : 'just now';
  if (minutes < 60) return language === 'ar' ? `منذ ${minutes} د` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  const date = new Date(isoDate);
  return date.toLocaleDateString(language === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'short' });
}
