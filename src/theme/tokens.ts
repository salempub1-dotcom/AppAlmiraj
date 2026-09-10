export const palette = {
  navy: '#0B1833',
  navySoft: '#132443',
  gold: '#D4AF37',
  goldSoft: '#F2E4B7',
  lightBg: '#F5F6FA',
  lightCard: '#FFFFFF',
  darkBg: '#080F1D',
  darkCard: '#111E32',
  text: '#121722',
  muted: '#59677D',
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
  surface: '#EEF2F7',
  text: palette.text,
  muted: palette.muted,
  primary: palette.gold,
  onPrimary: palette.navy,
  border: '#E2E7EF',
  danger: palette.danger
};

export const darkColors: AppColors = {
  background: palette.darkBg,
  card: palette.darkCard,
  surface: '#1A2A42',
  text: '#F7F9FC',
  muted: '#A9B4C5',
  primary: '#E1B94F',
  onPrimary: palette.navy,
  border: '#27364D',
  danger: '#FF8A80'
};
