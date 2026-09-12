export const ui = {
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999
  },
  controlHeight: 52,
  compactControlHeight: 48,
  iconButton: 42,
  contentMaxWidth: 720
} as const;

export const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2
} as const;
