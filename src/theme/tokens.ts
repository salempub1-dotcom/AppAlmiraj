export const palette = {
  // Core education palette used across the app outside the store identity.
  navy: '#0B1833',
  navySoft: '#132347',
  blue: '#1E3A66',
  indigo: '#2D3F73',
  sky: '#DCE8F5',

  // Softer warm accent: intentionally less metallic than the old gold.
  amber: '#D4B24C',
  amberSoft: '#E5C96A',
  amberPale: '#F4E8B7',

  // Light surfaces.
  lightBg: '#F5F7FB',
  lightCard: '#FFFFFF',
  lightSurface: '#EEF3F9',

  // Dark surfaces.
  darkBg: '#08111F',
  darkCard: '#101D31',
  darkSurface: '#182842',

  // Text + semantic colors.
  text: '#162033',
  muted: '#6B7280',
  white: '#FFFFFF',
  danger: '#C94A4A',
  success: '#3D8B72',
  info: '#4E6FAE'
};

export type AppColors = {
  background: string;
  backgroundAlt: string;
  card: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  onPrimary: string;
  border: string;
  divider: string;
  danger: string;
  success: string;
  info: string;
  tabBar: string;
  tabInactive: string;
};

export const lightColors: AppColors = {
  background: palette.lightBg,
  backgroundAlt: '#EDF2F8',
  card: palette.lightCard,
  surface: palette.lightSurface,
  surfaceStrong: '#E4ECF6',
  text: palette.text,
  muted: palette.muted,
  primary: palette.amber,
  primarySoft: palette.amberPale,
  secondary: palette.blue,
  onPrimary: palette.navy,
  border: '#DCE3EC',
  divider: '#E8EDF3',
  danger: palette.danger,
  success: palette.success,
  info: palette.info,
  tabBar: '#FFFFFF',
  tabInactive: '#8590A3'
};

export const darkColors: AppColors = {
  background: palette.darkBg,
  backgroundAlt: '#0D1728',
  card: palette.darkCard,
  surface: palette.darkSurface,
  surfaceStrong: '#203454',
  text: '#F7F9FC',
  muted: '#AAB4C3',
  primary: palette.amberSoft,
  primarySoft: '#3B3420',
  secondary: '#8EAADE',
  onPrimary: palette.navy,
  border: '#2A3A52',
  divider: '#223149',
  danger: '#FF9690',
  success: '#78C4A8',
  info: '#95B6ED',
  tabBar: '#0E1A2D',
  tabInactive: '#748198'
};

// Shared gradients for the educational sections of the app.
// The store can keep using its stronger brand identity separately.
export const appGradients = {
  hero: ['#0B1833', '#132347', '#1E3A66'] as const,
  heroSoft: ['#0E1B32', '#182B4B'] as const,
  cardGlow: ['rgba(30,58,102,0.22)', 'rgba(45,63,115,0.08)'] as const,
  accent: ['#D4B24C', '#E5C96A'] as const
};
