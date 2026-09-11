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

// Teacher Space deliberately owns a separate social design system.
// Al Miraj navy/gold branding remains reserved for the Store experience.
export function getCommunityTheme(appColors: AppColors) {
  const dark = isDarkHex(appColors.background);

  return dark
    ? {
        isDark: true,
        background: '#000000',
        surface: '#000000',
        surfaceRaised: '#121212',
        primary: '#5B8DEF',
        primaryStrong: '#8AB4FF',
        primarySoft: '#17233A',
        text: '#F5F5F5',
        textSecondary: '#D6D6D6',
        textMuted: '#A8A8A8',
        border: '#262626',
        divider: '#262626',
        success: '#47C78A',
        warning: '#F5B942',
        danger: '#FF6B6B',
        gold: '#F5B942',
        imageBackdrop: '#121212',
        shadow: '#000000'
      }
    : {
        isDark: false,
        background: '#FAFAFA',
        surface: '#FFFFFF',
        surfaceRaised: '#F3F3F3',
        primary: '#3975EA',
        primaryStrong: '#2E64CE',
        primarySoft: '#EEF4FF',
        text: '#171717',
        textSecondary: '#515151',
        textMuted: '#737373',
        border: '#DBDBDB',
        divider: '#EDEDED',
        success: '#2FA66D',
        warning: '#E6A11E',
        danger: '#E5484D',
        gold: '#E6A11E',
        imageBackdrop: '#F1F1F1',
        shadow: '#000000'
      };
}

export type CommunityTheme = ReturnType<typeof getCommunityTheme>;

export function getCommunityTypeTone(type: string, theme: CommunityTheme) {
  const dark = theme.isDark;

  switch (type) {
    case 'question':
      return { foreground: dark ? '#D5C7FF' : '#7650C8', background: dark ? '#2A2040' : '#F2EEFF' };
    case 'exam':
    case 'test':
      return { foreground: dark ? '#FFD978' : '#A86E00', background: dark ? '#382B13' : '#FFF4D6' };
    case 'idea':
    case 'tip':
      return { foreground: dark ? '#8EE5B5' : '#248457', background: dark ? '#153325' : '#E8F8EF' };
    case 'classroom_experience':
      return { foreground: dark ? '#78DCEF' : '#147C91', background: dark ? '#14343A' : '#E4F8FB' };
    case 'resource':
    case 'pdf':
      return { foreground: dark ? '#9AC1FF' : '#356FD4', background: dark ? '#172A49' : '#EAF1FF' };
    default:
      return { foreground: theme.primary, background: theme.primarySoft };
  }
}
