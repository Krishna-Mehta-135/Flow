import { FlowColors } from '@/constants/Colors';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native';

interface FlowButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const FlowButton: React.FC<FlowButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  disabled,
  ...props
}) => {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`${variant}ButtonText`],
    styles[`${size}ButtonText`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#ffffff' : FlowColors.primary} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },

  // Button Variants
  primaryButton: {
    backgroundColor: FlowColors.primary,
    shadowOpacity: 0.3,
  },
  secondaryButton: {
    backgroundColor: FlowColors.secondary,
    shadowOpacity: 0.3,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: FlowColors.primary,
    shadowOpacity: 0,
  },
  ghostButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0,
  },

  // Button Sizes
  smallButton: {
    height: 40,
    paddingHorizontal: 16,
    gap: 8,
  },
  mediumButton: {
    height: 48,
    paddingHorizontal: 20,
    gap: 10,
  },
  largeButton: {
    height: 56,
    paddingHorizontal: 24,
    gap: 12,
  },

  // Text Styles
  buttonText: {
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
  outlineButtonText: {
    color: FlowColors.primary,
  },
  ghostButtonText: {
    color: '#ffffff',
  },
  disabledText: {
    opacity: 0.6,
  },

  // Text Sizes
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
});