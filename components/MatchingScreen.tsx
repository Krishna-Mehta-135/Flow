import GradientCard from '@/components/ui/GradientCard';
import RoadAnimation from '@/components/ui/RoadAnimation';
import { FlowColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Member {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  joinedAt: string;
}

interface MatchingScreenProps {
  isMatching: boolean;
  members: Member[];
  pickupLocation: string;
  destination: string;
  estimatedCost: number;
  onContinue: () => void;
  onCancel: () => void;
}

export default function MatchingScreen({
  isMatching,
  members,
  pickupLocation,
  destination,
  estimatedCost,
  onContinue,
  onCancel
}: MatchingScreenProps) {
  const [searchAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(0.8));
  const [progressAnimation] = useState(new Animated.Value(0));
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (isMatching) {
      // Start search animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(searchAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(searchAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0.8,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress animation
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
      }).start();

      // Show members after 3 seconds
      const timer = setTimeout(() => {
        setShowMembers(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isMatching]);

  const interpolatedRotation = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!isMatching && members.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[FlowColors.backgroundDark, '#1f2937', '#0f172a']}
        style={styles.gradient}
      >
        {isMatching ? (
          // Matching Animation
          <View style={styles.matchingContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

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
                    { width: progressWidth }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>Analyzing routes...</Text>
            </View>

            {/* Status Updates */}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                ✓ Found 12 potential matches{'\n'}
                ✓ Checking schedules and routes{'\n'}
                ⏳ Optimizing for best experience
              </Text>
            </View>
          </View>
        ) : (
          // Match Found
          <View style={styles.matchFoundContainer}>
            <View style={styles.celebrationIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>

            <Text style={styles.successTitle}>Great! Found your carpool</Text>
            <Text style={styles.successSubtitle}>
              {members.length} riders matched for your journey
            </Text>

            {/* Trip Summary */}
            <GradientCard variant="glass" style={styles.summaryCard}>
              <View style={styles.routeInfo}>
                <View style={styles.routePoint}>
                  <Ionicons name="radio-button-on" size={16} color={FlowColors.primary} />
                  <Text style={styles.routeText}>{pickupLocation}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={16} color="#f59e0b" />
                  <Text style={styles.routeText}>{destination}</Text>
                </View>
              </View>
              <View style={styles.costInfo}>
                <Text style={styles.costLabel}>Your share</Text>
                <Text style={styles.costValue}>₹{estimatedCost}</Text>
              </View>
            </GradientCard>

            {/* Members */}
            <View style={styles.membersContainer}>
              <Text style={styles.membersTitle}>Your co-riders</Text>
              {members.map((member, index) => (
                <GradientCard key={member.id} variant="glass" style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.memberRating}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.ratingText}>{member.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.joinedText}>Just joined</Text>
                </GradientCard>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                <LinearGradient
                  colors={[FlowColors.primary, '#0d7aa7']}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueText}>Continue to ride</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelTextButton} onPress={onCancel}>
                <Text style={styles.cancelTextButtonText}>Cancel ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cancelButton: {
    padding: 8,
  },
  // Matching Animation Styles
  matchingContainer: {
    flex: 1,
    padding: 20,
  },
  roadAnimationContainer: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  searchCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  searchGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FlowColors.primary + '30',
  },
  rippleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: FlowColors.primary + '40',
  },
  matchingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  matchingSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginTop: 40,
    marginBottom: 32,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: FlowColors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 8,
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    lineHeight: 20,
  },
  // Match Found Styles
  matchFoundContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  celebrationIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#374151',
    marginLeft: 7,
    marginVertical: 4,
  },
  costInfo: {
    alignItems: 'flex-end',
  },
  costLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
  },
  costValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  membersContainer: {
    marginBottom: 32,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FlowColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 2,
  },
  memberRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#fbbf24',
    fontFamily: 'SpaceMono',
    marginLeft: 4,
  },
  joinedText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
  },
  actionsContainer: {
    paddingBottom: 40,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  cancelTextButton: {
    paddingVertical: 12,
  },
  cancelTextButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
});