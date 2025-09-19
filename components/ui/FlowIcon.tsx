import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FlowIconProps {
  size?: number;
  showBackground?: boolean;
}

export default function FlowIcon({ size = 64, showBackground = true }: FlowIconProps) {
  if (showBackground) {
    return (
      <LinearGradient
        colors={['#1193d4', '#0369a1']}
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size * 0.2,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name="car-sport" 
            size={size * 0.5} 
            color="#ffffff" 
          />
          <View style={[styles.dot, { width: size * 0.1, height: size * 0.1 }]} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Ionicons 
        name="car-sport" 
        size={size * 0.7} 
        color="#1193d4" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#10b981',
    borderRadius: 50,
    top: '20%',
    right: '20%',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});