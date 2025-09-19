import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { FlowColors } from '@/constants/Colors';

interface FlowTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const FlowTextInput: React.FC<FlowTextInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'medium',
  style,
  ...props
}) => {
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        styles[`${variant}Container`],
        styles[`${size}Container`],
        hasError && styles.errorContainer,
        style,
      ]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            styles[`${size}Input`],
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
          ]}
          placeholderTextColor="#6b7280"
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity style={styles.rightIconContainer}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorContainer: {
    borderColor: '#f87171',
  },

  // Variants
  defaultContainer: {
    // Default styling already applied above
  },
  filledContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'transparent',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Sizes
  smallContainer: {
    height: 40,
  },
  mediumContainer: {
    height: 48,
  },
  largeContainer: {
    height: 56,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    paddingHorizontal: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },

  // Input sizes
  smallInput: {
    fontSize: 14,
  },
  mediumInput: {
    fontSize: 16,
  },
  largeInput: {
    fontSize: 18,
  },

  leftIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingRight: 16,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
    marginTop: 4,
  },
  errorText: {
    color: '#f87171',
  },
});