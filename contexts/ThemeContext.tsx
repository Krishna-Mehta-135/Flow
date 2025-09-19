import { FlowColors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

// Flow Custom Light Theme
const flowLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: FlowColors.primary,
    primaryContainer: '#dbeafe',
    secondary: FlowColors.secondary,
    secondaryContainer: '#e2e8f0',
    tertiary: '#10b981',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#ffffff',
    error: '#ef4444',
    errorContainer: '#fef2f2',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#1e3a8a',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#1e293b',
    onSurface: '#111c22',
    onSurfaceVariant: '#6b7280',
    onBackground: '#111c22',
    outline: '#d1d5db',
    outlineVariant: '#e5e7eb',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#374151',
    inverseOnSurface: '#f9fafb',
    inversePrimary: '#60a5fa',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: 'SpaceMono',
      fontWeight: '400' as const,
    },
    headlineLarge: {
      fontFamily: 'SpaceMono',
      fontWeight: '700' as const,
      fontSize: 32,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'SpaceMono',
      fontWeight: '700' as const,
      fontSize: 28,
      lineHeight: 36,
    },
    titleLarge: {
      fontFamily: 'SpaceMono',
      fontWeight: '500' as const,
      fontSize: 22,
      lineHeight: 28,
    },
    bodyLarge: {
      fontFamily: 'SpaceMono',
      fontWeight: '400' as const,
      fontSize: 16,
      lineHeight: 24,
    },
  },
};

// Flow Custom Dark Theme (Primary theme based on HTML design)
const flowDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: FlowColors.primary,
    primaryContainer: '#1e40af',
    secondary: FlowColors.secondary,
    secondaryContainer: '#475569',
    tertiary: '#34d399',
    surface: '#374151',
    surfaceVariant: '#4b5563',
    background: FlowColors.backgroundDark,
    error: '#f87171',
    errorContainer: '#991b1b',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#dbeafe',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#e2e8f0',
    onSurface: '#ffffff',
    onSurfaceVariant: '#d1d5db',
    onBackground: '#ffffff',
    outline: '#6b7280',
    outlineVariant: '#374151',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#f9fafb',
    inverseOnSurface: '#111827',
    inversePrimary: '#1e40af',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    default: {
      fontFamily: 'SpaceMono',
      fontWeight: '400' as const,
    },
    headlineLarge: {
      fontFamily: 'SpaceMono',
      fontWeight: '700' as const,
      fontSize: 32,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'SpaceMono',
      fontWeight: '700' as const,
      fontSize: 28,
      lineHeight: 36,
    },
    titleLarge: {
      fontFamily: 'SpaceMono',
      fontWeight: '500' as const,
      fontSize: 22,
      lineHeight: 28,
    },
    bodyLarge: {
      fontFamily: 'SpaceMono',
      fontWeight: '400' as const,
      fontSize: 16,
      lineHeight: 24,
    },
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof flowDarkTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark mode for Flow

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Update system UI to match theme - always use Flow's dark background
    SystemUI.setBackgroundColorAsync(FlowColors.backgroundDark);
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themePreference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to dark mode for Flow app
        setIsDarkMode(true);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? flowDarkTheme : flowLightTheme;

  const value: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};
