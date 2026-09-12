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

// Teacher Space follows the approved visual reference: clean social surfaces,
// deep navy structure and restrained Al Miraj gold accents.
export function getCommunityTheme(appColors: AppColors) {
  const dark = isDarkHex(appColors.background);

  return dark
    ? {
        isDark: true,
        background: '#08111F',
        surface: '#0E1A2C',
        surfaceRaised: '#17253A',
        primary: '#D4AF37',
        primaryStrong: '#F0CA59',
        primarySoft: '#2C2A22',
        text: '#F7F9FC',
        textSecondary: '#D0D8E3',
        textMuted: '#97A5B7',
        border: '#26364B',
        divider: '#213146',
        success: '#47C78A',
        warning: '#F5B942',
        danger: '#FF6B6B',
        gold: '#D4AF37',
        imageBackdrop: '#152033',
        shadow: '#000000'
      }
    : {
        isDark: false,
        background: '#F7F9FC',
        surface: '#FFFFFF',
        surfaceRaised: '#F2F5F8',
        primary: '#0B1833',
        primaryStrong: '#163767',
        primarySoft: '#EDF2F8',
        text: '#101827',
        textSecondary: '#526071',
        textMuted: '#7B8797',
        border: '#DCE3EB',
        divider: '#E9EDF2',
        success: '#2FA66D',
        warning: '#C89522',
        danger: '#E5484D',
        gold: '#C89522',
        imageBackdrop: '#EEF2F6',
        shadow: '#0B1833'
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
      return { foreground: dark ? '#FFD978' : '#986700', background: dark ? '#382B13' : '#FFF4D6' };
    case 'idea':
    case 'tip':
      return { foreground: dark ? '#8EE5B5' : '#248457', background: dark ? '#153325' : '#E8F8EF' };
    case 'classroom_experience':
      return { foreground: dark ? '#78DCEF' : '#147C91', background: dark ? '#14343A' : '#E4F8FB' };
    case 'resource':
    case 'pdf':
      return { foreground: dark ? '#9AC1FF' : '#245B9B', background: dark ? '#172A49' : '#EAF1FF' };
    default:
      return { foreground: theme.primary, background: theme.primarySoft };
  }
}
