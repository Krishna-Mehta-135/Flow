import RoadAnimation from '@/components/ui/RoadAnimation';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MatchingScreenProps {
  pickupLocation?: string;
  destination?: string;
  onBack?: () => void;
}

const MatchingScreen: React.FC<MatchingScreenProps> = ({
  pickupLocation = "Connaught Place",
  destination = "Gurgaon Cyber City",
  onBack,
}) => {
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Searching for drivers...");
  const [isFound, setIsFound] = useState(false);

  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMatching) {
      // Simulate matching progress
      const timer = setTimeout(() => {
        setStatus("Analyzing routes...");
        setProgress(0.3);
      }, 2000);

      const timer2 = setTimeout(() => {
        setStatus("Connecting with nearby drivers...");
        setProgress(0.6);
      }, 4000);

      const timer3 = setTimeout(() => {
        setStatus("Match found! Confirming details...");
        setProgress(0.9);
      }, 6000);

      const timer4 = setTimeout(() => {
        setIsMatching(false);
        setIsFound(true);
        setProgress(1);
      }, 8000);

      // Animate progress bar
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [isMatching, progress]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleContinue = () => {
    router.push('/carpool-details');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />
      
      <LinearGradient
        colors={['#0a0f14', '#1a1f2e', '#0a0f14']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isFound ? 'Carpool Details' : 'Finding Your Ride'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {isMatching ? (
          /* Matching State */
          <View style={styles.matchingContainer}>
            {/* Road Animation */}
            <View style={styles.roadAnimationContainer}>
              <RoadAnimation isActive={isMatching} />
            </View>

            <Text style={styles.matchingTitle}>Searching for carpool matches</Text>
            <Text style={styles.matchingSubtitle}>
              We're connecting you with drivers heading your way. This may take a moment.
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{status}</Text>
            </View>
          </View>
        ) : (
          /* Found State */
          <View style={styles.foundContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#2ed573" />
            </View>

            <Text style={styles.successTitle}>Carpool Found!</Text>
            <Text style={styles.successSubtitle}>
              We found a perfect match for your journey
            </Text>

            {/* Trip Summary */}
            <View style={styles.summaryCard}>
              <BlurView intensity={20} style={styles.summaryBlur}>
                <View style={styles.routeInfo}>
                  <View style={styles.routeItem}>
                    <Ionicons name="radio-button-on" size={16} color="#1193d4" />
                    <Text style={styles.routeText}>{pickupLocation}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeItem}>
                    <Ionicons name="location" size={16} color="#ff4757" />
                    <Text style={styles.routeText}>{destination}</Text>
                  </View>
                </View>

                <View style={styles.tripDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Departure</Text>
                    <Text style={styles.detailValue}>9:00 AM</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>75 min</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Cost</Text>
                    <Text style={styles.detailValue}>₹225</Text>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Continue Button */}
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <LinearGradient
                colors={['#1193d4', '#0c7db8']}
                style={styles.buttonGradient}
              >
                <Text style={styles.continueButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f14',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: -28,
  },
  headerSpacer: {
    width: 28,
  },
  matchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  roadAnimationContainer: {
    marginBottom: 40,
    width: '100%',
    maxWidth: 320,
  },
  matchingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  matchingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    maxWidth: 280,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1193d4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 12,
  },
  foundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 24,
    shadowColor: '#2ed573',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  summaryBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
  },
  routeInfo: {
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 7,
    marginVertical: 4,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});

export default MatchingScreen;