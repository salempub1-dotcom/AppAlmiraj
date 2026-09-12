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
          <View style={styles.googleIconWrap}>
            <FontAwesome name="google" size={20} color="#4285F4" />
          </View>
        )}
      </View>

      <Text style={styles.title}>{loading ? 'جارٍ فتح Google…' : title}</Text>
      <View style={styles.iconSlot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  buttonPressed: {
    backgroundColor: '#F8F9FA',
    borderColor: '#C9CDD2'
  },
  buttonLoading: {
    opacity: 0.76
  },
  iconSlot: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  title: {
    flex: 1,
    color: '#202124',
    fontSize: 15.5,
    fontWeight: '700',
    textAlign: 'center'
  }
});
