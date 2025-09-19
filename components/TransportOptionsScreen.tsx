import GradientCard from '@/components/ui/GradientCard';
import { FlowColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface TransportOption {
  id: string;
  type: 'carpool' | 'metro' | 'taxi';
  title: string;
  subtitle: string;
  time: string;
  price: string;
  icon: string;
  selected?: boolean;
  mlPrediction?: {
    trafficLevel: 'low' | 'medium' | 'high';
    confidence: number;
  };
}

interface TransportOptionsScreenProps {
  destination: string;
  options: TransportOption[];
  onSelectOption: (option: TransportOption) => void;
}

export default function TransportOptionsScreen({ 
  destination, 
  options, 
  onSelectOption 
}: TransportOptionsScreenProps) {
  
  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getOptionStyle = (option: TransportOption) => {
    if (option.selected) {
      return [styles.optionCard, styles.selectedOption];
    }
    return styles.optionCard;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[FlowColors.backgroundDark, '#1f2937']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            To: {destination}
          </Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Choose a ride</Text>

          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={getOptionStyle(option)}
                onPress={() => onSelectOption(option)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    option.selected 
                      ? [FlowColors.primary, '#0d7aa7']
                      : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                  }
                  style={styles.optionGradient}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionInfo}>
                      <View style={styles.optionHeader}>
                        <Text style={[
                          styles.optionTitle,
                          option.selected && styles.selectedText
                        ]}>
                          {option.title}
                        </Text>
                        {option.mlPrediction && (
                          <View style={[
                            styles.trafficIndicator,
                            { backgroundColor: getTrafficColor(option.mlPrediction.trafficLevel) + '20' }
                          ]}>
                            <Text style={[
                              styles.trafficText,
                              { color: getTrafficColor(option.mlPrediction.trafficLevel) }
                            ]}>
                              {option.mlPrediction.trafficLevel} traffic
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.optionDetails}>
                        <Text style={[
                          styles.optionSubtitle,
                          option.selected && styles.selectedSubtext
                        ]}>
                          {option.subtitle}
                        </Text>
                        <Text style={[
                          styles.optionTime,
                          option.selected && styles.selectedSubtext
                        ]}>
                          {option.time}
                        </Text>
                      </View>

                      {option.mlPrediction && (
                        <Text style={[
                          styles.confidenceText,
                          option.selected && styles.selectedSubtext
                        ]}>
                          {Math.round(option.mlPrediction.confidence * 100)}% confidence
                        </Text>
                      )}
                    </View>

                    <View style={styles.optionPrice}>
                      <Text style={[
                        styles.priceText,
                        option.selected && styles.selectedText
                      ]}>
                        {option.price}
                      </Text>
                      <View style={[
                        styles.optionIcon,
                        option.selected && styles.selectedIcon
                      ]}>
                        <Ionicons 
                          name={option.icon as any} 
                          size={24} 
                          color={option.selected ? '#ffffff' : FlowColors.primary} 
                        />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Insights */}
          <GradientCard variant="glass" style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb" size={20} color={FlowColors.primary} />
              <Text style={styles.insightsTitle}>AI Insights</Text>
            </View>
            <Text style={styles.insightsText}>
              Based on current traffic and weather conditions, carpool is your best option. 
              You'll save ₹180 compared to a taxi and arrive 10 minutes faster than metro.
            </Text>
          </GradientCard>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedOption: {
    transform: [{ scale: 1.02 }],
  },
  optionGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    flex: 1,
  },
  selectedText: {
    color: '#ffffff',
  },
  trafficIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trafficText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },
  optionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    marginRight: 16,
  },
  selectedSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optionTime: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
  },
  optionPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginLeft: 8,
  },
  insightsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    lineHeight: 20,
  },
});