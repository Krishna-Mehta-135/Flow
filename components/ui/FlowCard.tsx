import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

interface FlowCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

interface FlowCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

interface FlowCardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface FlowCardActionsProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FlowCard: React.FC<FlowCardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  onPress,
  style,
  contentStyle,
}) => {
  const cardStyle = [
    styles.card,
    styles[`${variant}Card`],
    styles[`${padding}Padding`],
    style,
  ];

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={cardStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </CardComponent>
  );
};

export const FlowCardHeader: React.FC<FlowCardHeaderProps> = ({
  title,
  subtitle,
  action,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
};

export const FlowCardContent: React.FC<FlowCardContentProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.cardContent, style]}>
      {children}
    </View>
  );
};

export const FlowCardActions: React.FC<FlowCardActionsProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.actions, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },

  // Card Variants
  defaultCard: {
    // Default styles already applied
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  outlinedCard: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
  },

  // Padding Variants
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerAction: {
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
  },

  // Content Styles
  cardContent: {
    flex: 1,
  },

  // Actions Styles
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
});