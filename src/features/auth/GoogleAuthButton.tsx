import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider';

export function GoogleAuthButton({
  title,
  loading,
  onPress
}: {
  title: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: '#FFFFFF',
          borderColor: '#DADCE0',
          opacity: loading ? 0.65 : pressed ? 0.82 : 1
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>G</Text>
        </View>
      )}
      <Text style={[styles.title, { color: colors.text }]}>{loading ? 'جارٍ الاتصال بـ Google…' : title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  logoWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    color: '#4285F4',
    fontSize: 20,
    fontWeight: '900'
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    textAlign: 'center'
  }
});
