import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GradientCardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'gradient';
  style?: ViewStyle;
  glowColor?: string;
}

export default function GradientCard({ 
  children, 
  variant = 'glass', 
  style,
  glowColor = '#1193d4'
}: GradientCardProps) {
  if (variant === 'glass') {
    return (
      <BlurView intensity={20} style={[styles.card, styles.glassCard, style]}>
        <View style={[styles.glassOverlay, { borderColor: `${glowColor}20` }]}>
          {children}
        </View>
      </BlurView>
    );
  }

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['rgba(17, 147, 212, 0.1)', 'rgba(17, 147, 212, 0.05)']}
        style={[styles.card, style]}
      >
        <View style={styles.gradientOverlay}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, styles.solidCard, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  solidCard: {
    backgroundColor: '#233c48',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassOverlay: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  gradientOverlay: {
    flex: 1,
    padding: 16,
  },
});