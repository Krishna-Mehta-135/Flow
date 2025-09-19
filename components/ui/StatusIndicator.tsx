import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'loading' | 'error';
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusIndicator({ 
  status, 
  label, 
  size = 'medium' 
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: '#10b981',
          icon: 'checkmark-circle' as const,
          text: 'Connected',
        };
      case 'offline':
        return {
          color: '#ef4444',
          icon: 'close-circle' as const,
          text: 'Disconnected',
        };
      case 'loading':
        return {
          color: '#f59e0b',
          icon: 'time' as const,
          text: 'Connecting...',
        };
      case 'error':
        return {
          color: '#ef4444',
          icon: 'warning' as const,
          text: 'Error',
        };
      default:
        return {
          color: '#6b7280',
          icon: 'help-circle' as const,
          text: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();
  const sizeMultiplier = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1;
  const iconSize = 16 * sizeMultiplier;
  const fontSize = 14 * sizeMultiplier;

  return (
    <View style={[styles.container, { opacity: status === 'loading' ? 0.7 : 1 }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Ionicons 
        name={config.icon} 
        size={iconSize} 
        color={config.color} 
        style={styles.icon}
      />
      <Text style={[styles.text, { color: config.color, fontSize }]}>
        {label || config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  icon: {
    marginLeft: 2,
  },
  text: {
    fontWeight: '500',
  },
});