import { FlowColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <LinearGradient
      colors={[FlowColors.backgroundDark, '#0a1419']}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={FlowColors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  message: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});