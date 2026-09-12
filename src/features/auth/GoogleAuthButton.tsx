import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ui } from '../../theme/ui';

export function GoogleAuthButton({
  title,
  loading,
  onPress
}: {
  title: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !loading ? styles.buttonPressed : null,
        loading ? styles.buttonLoading : null
      ]}
    >
      <View style={styles.iconSlot}>
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <FontAwesome name="google" size={20} color="#4285F4" />
        )}
      </View>
      <Text style={styles.title}>{loading ? 'جارٍ فتح Google…' : title}</Text>
      <View style={styles.iconSlot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ui.controlHeight,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  buttonPressed: {
    backgroundColor: '#F7F8FA',
    borderColor: '#C7CCD2',
    transform: [{ scale: 0.985 }]
  },
  buttonLoading: { opacity: 0.76 },
  iconSlot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    color: '#202124',
    fontSize: 15.5,
    fontWeight: '700',
    textAlign: 'center'
  }
});
