/**
 * Flow App Design System - Colors
 * Based on the modern dark theme design with blue accents
 */

const primaryColor = '#1193d4';
const secondaryColor = '#233c48';
const backgroundDark = '#111c22';
const backgroundLight = '#ffffff';

export const Colors = {
  light: {
    text: '#111c22',
    textSecondary: '#6b7280',
    background: backgroundLight,
    backgroundSecondary: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    primary: primaryColor,
    primaryContainer: '#dbeafe',
    secondary: secondaryColor,
    secondaryContainer: '#e2e8f0',
    accent: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    tint: primaryColor,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: primaryColor,
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#9ca3af',
    background: backgroundDark,
    backgroundSecondary: '#1f2937',
    surface: '#374151',
    surfaceSecondary: '#4b5563',
    primary: primaryColor,
    primaryContainer: '#1e40af',
    secondary: secondaryColor,
    secondaryContainer: '#475569',
    accent: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
    tint: '#ffffff',
    icon: '#d1d5db',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#ffffff',
    border: '#374151',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Flow-specific color tokens
export const FlowColors = {
  primary: primaryColor,
  secondary: secondaryColor,
  backgroundDark: backgroundDark,
  gradientStart: 'rgba(17, 28, 34, 0)',
  gradientEnd: backgroundDark,
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  glassEffect: 'rgba(255, 255, 255, 0.08)',
};
