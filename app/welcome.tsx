import { FlowColors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{
          uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpRDYruizL2LHVdiZAHisEj7a96u3e9KMgvzHDoKiQsxxeFbIVoTdAG8gSlTh81Wx361_SEGH7g_7vi3t6EhxFcQ13gQEgxLOkmiM3uMqJftLIgpeJygHk7DT7w8j2ErjSoyhwF2Rr5tVpx8nV-2hS_TyxxXWjwQKR0_v-cWtkqFsQ-CaJfzzUkRJIOFmUdXW54XkkD5-dHTQITLVC_9gzLvtMik09kJyCUE12k6k_npPxwXlw7sKWYvNBH_d7HnjvNcTLeiMVnPBf'
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[FlowColors.gradientStart, FlowColors.gradientEnd]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Logo and Title Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Flow</Text>
              <Text style={styles.subtitle}>
                AI-powered transport optimising your commute with smart carpooling.
              </Text>
            </View>

            {/* Action Buttons Section */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSignUp}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#d1d5db',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    opacity: 0.9,
  },
  actionSection: {
    gap: 16,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: FlowColors.primary,
  },
  secondaryButton: {
    backgroundColor: FlowColors.secondary,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
});