type AppColors = {
  background?: string;
  card?: string;
  text?: string;
  muted?: string;
  border?: string;
};

function isDarkHex(value?: string) {
  if (!value || !value.startsWith('#')) return false;
  const hex = value.slice(1);
  if (hex.length !== 6) return false;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.45;
}

export function getCommunityTheme(appColors: AppColors) {
  const dark = isDarkHex(appColors.background);

  return dark
    ? {
        isDark: true,
        background: '#0F172A',
        surface: '#111827',
        surfaceRaised: '#1F2937',
        primary: '#60A5FA',
        primaryStrong: '#3B82F6',
        primarySoft: '#172554',
        text: '#F9FAFB',
        textSecondary: '#CBD5E1',
        textMuted: '#94A3B8',
        border: '#334155',
        divider: '#263244',
        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',
        gold: '#D4AF37',
        imageBackdrop: '#0B1220',
        shadow: '#000000'
      }
    : {
        isDark: false,
        background: '#F5F7FB',
        surface: '#FFFFFF',
        surfaceRaised: '#FFFFFF',
        primary: '#2563EB',
        primaryStrong: '#1D4ED8',
        primarySoft: '#DBEAFE',
        text: '#111827',
        textSecondary: '#4B5563',
        textMuted: '#9CA3AF',
        border: '#E5E7EB',
        divider: '#EEF2F7',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        gold: '#D4AF37',
        imageBackdrop: '#EEF2F7',
        shadow: '#0F172A'
      };
}

export type CommunityTheme = ReturnType<typeof getCommunityTheme>;

export function getCommunityTypeTone(type: string, theme: CommunityTheme) {
  const dark = theme.isDark;

  switch (type) {
    case 'question':
      return {
        foreground: dark ? '#C4B5FD' : '#7C3AED',
        background: dark ? '#2E1065' : '#F3E8FF'
      };
    case 'exam':
    case 'test':
      return {
        foreground: dark ? '#FCD34D' : '#B45309',
        background: dark ? '#451A03' : '#FEF3C7'
      };
    case 'idea':
    case 'tip':
      return {
        foreground: dark ? '#86EFAC' : '#15803D',
        background: dark ? '#052E16' : '#DCFCE7'
      };
    case 'classroom_experience':
      return {
        foreground: dark ? '#67E8F9' : '#0E7490',
        background: dark ? '#164E63' : '#CFFAFE'
      };
    case 'resource':
    case 'pdf':
      return {
        foreground: dark ? '#93C5FD' : '#1D4ED8',
        background: dark ? '#172554' : '#DBEAFE'
      };
    default:
      return {
        foreground: theme.primary,
        background: theme.primarySoft
      };
  }
}
