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

// Teacher Space uses the educational visual system: navy/indigo structure,
// clean social surfaces and a softer amber accent. The stronger Al Miraj
// retail identity remains reserved for the Store section.
export function getCommunityTheme(appColors: AppColors) {
  const dark = isDarkHex(appColors.background);

  return dark
    ? {
        isDark: true,
        background: '#08111F',
        surface: '#101D31',
        surfaceRaised: '#182842',
        primary: '#E5C96A',
        primaryStrong: '#F0DA8C',
        primarySoft: '#3B3420',
        text: '#F7F9FC',
        textSecondary: '#D2D9E4',
        textMuted: '#A2ADBD',
        border: '#2A3A52',
        divider: '#223149',
        success: '#78C4A8',
        warning: '#E5C96A',
        danger: '#FF9690',
        gold: '#E5C96A',
        imageBackdrop: '#15243A',
        shadow: '#000000'
      }
    : {
        isDark: false,
        background: '#F5F7FB',
        surface: '#FFFFFF',
        surfaceRaised: '#EEF3F9',
        primary: '#1E3A66',
        primaryStrong: '#132347',
        primarySoft: '#E8EEF7',
        text: '#162033',
        textSecondary: '#566375',
        textMuted: '#7A8798',
        border: '#DCE3EC',
        divider: '#E8EDF3',
        success: '#3D8B72',
        warning: '#D4B24C',
        danger: '#C94A4A',
        gold: '#D4B24C',
        imageBackdrop: '#EEF3F9',
        shadow: '#0B1833'
      };
}

export type CommunityTheme = ReturnType<typeof getCommunityTheme>;

export function getCommunityTypeTone(type: string, theme: CommunityTheme) {
  const dark = theme.isDark;

  switch (type) {
    case 'question':
      return { foreground: dark ? '#D9CEFF' : '#7650C8', background: dark ? '#292440' : '#F2EEFF' };
    case 'exam':
    case 'test':
      return { foreground: dark ? '#F3D77D' : '#8B6500', background: dark ? '#39311E' : '#FFF5D9' };
    case 'idea':
    case 'tip':
      return { foreground: dark ? '#91DDB9' : '#2E7D5B', background: dark ? '#173426' : '#E9F7EF' };
    case 'classroom_experience':
      return { foreground: dark ? '#8ADAE9' : '#277A91', background: dark ? '#17333A' : '#E6F6FA' };
    case 'resource':
    case 'pdf':
      return { foreground: dark ? '#A7C6F5' : '#345F9A', background: dark ? '#192D48' : '#EAF1FB' };
    default:
      return { foreground: theme.primary, background: theme.primarySoft };
  }
}
