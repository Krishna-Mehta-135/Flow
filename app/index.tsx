import { FlowColors } from '@/constants/Colors';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Flow App is Working! 🚗</Text>
      <Text style={styles.subtext}>If you see this, the app is running correctly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});