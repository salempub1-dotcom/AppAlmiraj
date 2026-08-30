export const palette = {
  navy: '#0B1833',
  gold: '#D4AF37',
  lightBg: '#F5F6F8',
  lightCard: '#FFFFFF',
  darkBg: '#15130F',
  darkCard: '#211C14',
  text: '#171717',
  muted: '#746F67',
  white: '#FFFFFF',
  danger: '#B42318'
};

export type AppColors = {
  background: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  border: string;
  danger: string;
};

export const lightColors: AppColors = {
  background: palette.lightBg,
  card: palette.lightCard,
  text: palette.text,
  muted: palette.muted,
  primary: palette.gold,
  border: '#E2E4E8',
  danger: palette.danger
};

export const darkColors: AppColors = {
  background: palette.darkBg,
  card: palette.darkCard,
  text: '#F6F0E5',
  muted: '#B9AD9D',
  primary: '#DEB34F',
  border: '#3A3023',
  danger: '#FF8A80'
};
