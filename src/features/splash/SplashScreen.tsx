import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { AL_MIRAJ_LOGO_DATA_URI } from '../../assets/alMirajLogo';

export function SplashScreen() {
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.bgTop} />
        <View style={styles.bgMiddle} />
        <View style={styles.glowRight} />
        <View style={styles.glowLeft} />

        <View style={styles.board}>
          <View style={styles.boardLineLong} />
          <View style={styles.boardLineShort} />
          <View style={styles.boardLineMedium} />
        </View>

        <View style={styles.shelf}>
          <View style={[styles.bookSpine, { height: 54 }]} />
          <View style={[styles.bookSpine, { height: 70, opacity: 0.7 }]} />
          <View style={[styles.bookSpine, { height: 62, opacity: 0.55 }]} />
          <View style={[styles.bookSpine, { height: 48, opacity: 0.42 }]} />
        </View>

        <View style={styles.desk} />
        <View style={styles.bookStackA} />
        <View style={styles.bookStackB} />
        <View style={styles.notebook} />
        <View style={styles.arcTop} />
        <View style={styles.arcBottom} />
      </View>

      <View style={styles.brandBlock}>
        <View style={styles.logoGlow} />
        <Image source={{ uri: AL_MIRAJ_LOGO_DATA_URI }} resizeMode="contain" style={styles.logo} />
        <Text style={styles.brandArabic}>المعراج</Text>
        <Text style={styles.brandEnglish}>Al Miraj Education</Text>
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <View style={styles.diamond} />
          <View style={styles.divider} />
        </View>
        <Text style={styles.tagline}>بالعلم .. نصنع مستقبلاً أفضل</Text>
      </View>

      <View style={styles.loadingBlock}>
        <ActivityIndicator size="small" color="#D4B24C" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08111F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  bgTop: {
    position: 'absolute',
    left: -80,
    right: -40,
    top: -80,
    height: '55%',
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 260,
    backgroundColor: '#132347',
    opacity: 0.94
  },
  bgMiddle: {
    position: 'absolute',
    left: -120,
    right: -100,
    top: '28%',
    height: '44%',
    borderRadius: 280,
    backgroundColor: '#1E3A66',
    opacity: 0.28,
    transform: [{ rotate: '-8deg' }]
  },
  glowRight: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    right: -120,
    top: '32%',
    backgroundColor: '#D4B24C',
    opacity: 0.09
  },
  glowLeft: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    left: -130,
    top: '8%',
    backgroundColor: '#6687C7',
    opacity: 0.1
  },
  board: {
    position: 'absolute',
    right: -18,
    top: '20%',
    width: 165,
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(203,218,240,0.12)',
    backgroundColor: 'rgba(10,23,42,0.30)',
    padding: 22,
    gap: 12,
    transform: [{ rotate: '-2deg' }]
  },
  boardLineLong: { height: 4, borderRadius: 2, backgroundColor: 'rgba(213,225,242,0.10)', width: '82%' },
  boardLineShort: { height: 4, borderRadius: 2, backgroundColor: 'rgba(213,225,242,0.08)', width: '52%' },
  boardLineMedium: { height: 4, borderRadius: 2, backgroundColor: 'rgba(213,225,242,0.07)', width: '68%' },
  shelf: {
    position: 'absolute',
    left: -18,
    top: '19%',
    width: 92,
    height: 175,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(203,218,240,0.10)',
    backgroundColor: 'rgba(8,17,31,0.26)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    paddingHorizontal: 14,
    paddingBottom: 24,
    opacity: 0.75
  },
  bookSpine: { width: 9, borderRadius: 3, backgroundColor: '#8EAADD' },
  desk: {
    position: 'absolute',
    left: -40,
    right: -30,
    bottom: 92,
    height: 118,
    borderTopWidth: 1,
    borderColor: 'rgba(229,201,106,0.16)',
    backgroundColor: 'rgba(5,13,24,0.46)',
    transform: [{ rotate: '2deg' }]
  },
  bookStackA: {
    position: 'absolute',
    left: 26,
    bottom: 150,
    width: 118,
    height: 15,
    borderRadius: 5,
    backgroundColor: 'rgba(229,232,239,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212,178,76,0.14)'
  },
  bookStackB: {
    position: 'absolute',
    left: 38,
    bottom: 167,
    width: 100,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(119,145,188,0.18)'
  },
  notebook: {
    position: 'absolute',
    left: 66,
    bottom: 130,
    width: 134,
    height: 7,
    borderRadius: 5,
    backgroundColor: 'rgba(204,216,234,0.17)',
    transform: [{ rotate: '-3deg' }]
  },
  arcTop: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1.3,
    borderColor: 'rgba(212,178,76,0.28)',
    left: -210,
    top: -190
  },
  arcBottom: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1.3,
    borderColor: 'rgba(212,178,76,0.22)',
    right: -235,
    bottom: 20
  },
  brandBlock: {
    alignItems: 'center',
    width: '86%',
    marginTop: -42
  },
  logoGlow: {
    position: 'absolute',
    top: -14,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D4B24C',
    opacity: 0.08
  },
  logo: {
    width: 172,
    height: 172,
    marginBottom: 4
  },
  brandArabic: {
    color: '#E5C96A',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: -2
  },
  brandEnglish: {
    color: '#F1D88A',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 3
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18
  },
  divider: {
    width: 72,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(229,201,106,0.58)'
  },
  diamond: {
    width: 7,
    height: 7,
    backgroundColor: '#D4B24C',
    transform: [{ rotate: '45deg' }]
  },
  tagline: {
    marginTop: 14,
    color: '#B8C3D5',
    fontSize: 14.5,
    fontWeight: '600',
    textAlign: 'center'
  },
  loadingBlock: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: 11
  },
  loadingText: {
    color: '#AAB4C3',
    fontSize: 12.5,
    fontWeight: '600'
  }
});
