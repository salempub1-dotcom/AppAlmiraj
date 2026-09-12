export const palette = {
  navy: '#0B1833',
  navySoft: '#132443',
  gold: '#D4AF37',
  goldSoft: '#F2E4B7',
  lightBg: '#F7F8FA',
  lightCard: '#FFFFFF',
  darkBg: '#090F1B',
  darkCard: '#111B2D',
  text: '#151922',
  muted: '#637083',
  white: '#FFFFFF',
  danger: '#B42318'
};

export type AppColors = {
  background: string;
  card: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  onPrimary: string;
  border: string;
  danger: string;
};

export const lightColors: AppColors = {
  background: palette.lightBg,
  card: palette.lightCard,
  surface: '#F0F3F7',
  text: palette.text,
  muted: palette.muted,
  primary: palette.gold,
  onPrimary: palette.navy,
  border: '#E3E7ED',
  danger: palette.danger
};

export const darkColors: AppColors = {
  background: palette.darkBg,
  card: palette.darkCard,
  surface: '#1A2639',
  text: '#F7F9FC',
  muted: '#A9B3C2',
  primary: '#E1B94F',
  onPrimary: palette.navy,
  border: '#29364A',
  danger: '#FF8A80'
};
