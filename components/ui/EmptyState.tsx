import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlowButton } from './FlowButton';
import { FlowColors } from '@/constants/Colors';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionTitle?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  title, 
  description, 
  icon, 
  actionTitle, 
  onAction 
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color="#4b5563" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <FlowButton
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    minWidth: 200,
  },
});