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

// Teacher Space keeps a neutral social identity while borrowing the same
// level of polish and spacing discipline as the rest of Al Miraj.
export function getCommunityTheme(appColors: AppColors) {
  const dark = isDarkHex(appColors.background);

  return dark
    ? {
        isDark: true,
        background: '#0A0B0D',
        surface: '#111317',
        surfaceRaised: '#181B20',
        primary: '#6E9BF5',
        primaryStrong: '#9BBCFF',
        primarySoft: '#18243A',
        text: '#F7F8FA',
        textSecondary: '#D2D7DE',
        textMuted: '#8D96A3',
        border: '#2A2F36',
        divider: '#22262C',
        success: '#4CC38A',
        warning: '#F2B84B',
        danger: '#FF7477',
        gold: '#E6B94B',
        imageBackdrop: '#171A1F',
        shadow: '#000000'
      }
    : {
        isDark: false,
        background: '#F6F7F9',
        surface: '#FFFFFF',
        surfaceRaised: '#F3F5F7',
        primary: '#356FE5',
        primaryStrong: '#245BC4',
        primarySoft: '#EDF3FF',
        text: '#16181D',
        textSecondary: '#4E5663',
        textMuted: '#7A8492',
        border: '#DDE2E8',
        divider: '#E9EDF1',
        success: '#2D9D69',
        warning: '#D99517',
        danger: '#D94C52',
        gold: '#D8A72F',
        imageBackdrop: '#EFF2F5',
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
