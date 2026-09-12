import { FontAwesome } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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
          <FontAwesome name="google" size={22} color="#4285F4" />
        )}
      </View>

      <Text style={styles.title}>{loading ? 'جارٍ فتح Google…' : title}</Text>
      <View style={styles.iconSlot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  buttonPressed: {
    backgroundColor: '#F7F8F8',
    borderColor: '#C9CDD2'
  },
  buttonLoading: {
    opacity: 0.78
  },
  iconSlot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    color: '#202124',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center'
  }
});
