export const palette = {
  navy: '#0B1833',
  navySoft: '#132443',
  gold: '#D4AF37',
  goldSoft: '#F2E4B7',
  lightBg: '#F4F6FA',
  lightCard: '#FFFFFF',
  darkBg: '#07111F',
  darkCard: '#0E1B2D',
  text: '#121722',
  muted: '#687385',
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
  surface: '#16253A',
  text: '#F7F9FC',
  muted: '#A9B4C5',
  primary: '#E1B94F',
  onPrimary: palette.navy,
  border: '#22334C',
  danger: '#FF8A80'
};
