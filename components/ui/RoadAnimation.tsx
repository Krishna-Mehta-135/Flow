import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface RoadAnimationProps {
  isActive: boolean;
}

const RoadAnimation: React.FC<RoadAnimationProps> = ({ isActive }) => {
  const roadLine1 = useRef(new Animated.Value(-40)).current;
  const roadLine2 = useRef(new Animated.Value(-80)).current;
  const roadLine3 = useRef(new Animated.Value(-120)).current;
  const carBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Start road line animations
      const animateRoadLine = (animatedValue: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animatedValue, {
              toValue: 240, // Move from top to bottom
              duration: 1500,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: -40,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      // Start car bobbing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(carBob, {
            toValue: -5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(carBob, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start road lines with staggered delays
      animateRoadLine(roadLine1, 0);
      animateRoadLine(roadLine2, 500);
      animateRoadLine(roadLine3, 1000);
    }
  }, [isActive]);

  return (
    <View style={styles.roadContainer}>
      {/* Road Background */}
      <View style={styles.road} />
      
      {/* Animated Road Lines */}
      <Animated.View
        style={[
          styles.roadLine,
          {
            transform: [{ translateY: roadLine1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.roadLine,
          {
            transform: [{ translateY: roadLine2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.roadLine,
          {
            transform: [{ translateY: roadLine3 }],
          },
        ]}
      />
      
      {/* Animated Car */}
      <Animated.View
        style={[
          styles.car,
          {
            transform: [{ translateY: carBob }],
          },
        ]}
      >
        <Ionicons name="car" size={48} color="#1193d4" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  roadContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  road: {
    position: 'absolute',
    top: 0,
    left: '45%',
    right: '45%',
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  roadLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  car: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -24,
    shadowColor: '#1193d4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default RoadAnimation;