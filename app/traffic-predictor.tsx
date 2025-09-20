import MLRoutePicker from '@/components/MLRoutePicker';
import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { MLSupportedRoute } from '@/services/mlSupportedRoutes';
import transportationService, { TransportationOption } from '@/services/transportationService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Simple interface for your ML response
interface MLPredictionResponse {
  prediction: number; // 0 or 1 (0 = don't go, 1 = go)
  probabilities: [number, number]; // [prob_dont_go, prob_go]
}

interface TrafficPrediction {
  route: MLSupportedRoute;
  currentTraffic: {
    shouldGo: boolean;
    confidence: number;
    reason: string;
  };
  recommendation: {
    shouldLeaveNow: boolean;
    reason: string;
    confidence: number;
  };
}

const FutureTrafficScreen = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  // Route state - using ML supported routes
  const [selectedRoute, setSelectedRoute] = useState<MLSupportedRoute | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  
  // Time state - default to 1 hour from now for future predictions
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Prediction state
  const [prediction, setPrediction] = useState<TrafficPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRouteSelect = (route: MLSupportedRoute) => {
    setSelectedRoute(route);
    setShowRoutePicker(false);
  };

  // Call your ML API directly
  const callMLPrediction = async (route: MLSupportedRoute): Promise<MLPredictionResponse> => {
    try {
      // TODO: Replace with your actual ML API endpoint
      const ML_API_ENDPOINT = 'YOUR_ML_API_ENDPOINT'; // Replace with your ML server URL
      
      const response = await fetch(ML_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: route.id,
          from: route.origin,
          to: route.destination,
          time: selectedDate.toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('ML API Response:', result);
      return result;
    } catch (error) {
      console.error('ML API call failed:', error);
      // Mock response for testing with your format
      const mockConfidence = Math.random() * 0.6 + 0.4; // 40% to 100%
      const mockPrediction = mockConfidence > 0.6 ? 1 : 0;
      
      return {
        prediction: mockPrediction,
        probabilities: mockPrediction === 1 
          ? [1 - mockConfidence, mockConfidence] 
          : [mockConfidence, 1 - mockConfidence]
      };
    }
  };

  const getPrediction = async () => {
    if (!selectedRoute) {
      Alert.alert('Error', 'Please select a route');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to get traffic predictions', [
        { text: 'Login', onPress: () => router.push('/login') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    console.log('Getting ML prediction for route:', selectedRoute.description);
    setIsLoading(true);
    
    try {
      // Call your simplified ML API
      const mlResponse = await callMLPrediction(selectedRoute);
      
      // Extract confidence from probabilities
      const confidence = Math.max(...mlResponse.probabilities) * 100;
      const shouldGo = mlResponse.prediction === 1;
      
      let reason = '';
      if (confidence > 40) {
        if (shouldGo) {
          reason = `Good time to travel! ML predicts favorable conditions with ${confidence.toFixed(1)}% confidence.`;
        } else {
          reason = `Not recommended to travel now. ML predicts poor conditions with ${confidence.toFixed(1)}% confidence. Consider waiting.`;
        }
      } else {
        reason = `Uncertain prediction (${confidence.toFixed(1)}% confidence). Consider checking current traffic manually.`;
      }

      const predictionResult: TrafficPrediction = {
        route: selectedRoute,
        currentTraffic: {
          shouldGo: shouldGo,
          confidence: confidence,
          reason: reason,
        },
        recommendation: {
          shouldLeaveNow: shouldGo && confidence > 40,
          reason: reason,
          confidence: confidence,
        },
      };
      
      setPrediction(predictionResult);
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert('Error', 'Failed to get traffic prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrafficColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
    }
  };

  const getTrafficIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'checkmark-circle';
      case 'medium': return 'warning';
      case 'high': return 'alert-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />
      
      <LinearGradient
        colors={['#0a0f14', '#1a1f2e', '#0a0f14']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Traffic Predictor</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Route Selection */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Route</Text>
              <TouchableOpacity
                style={styles.routeButton}
                onPress={() => setShowRoutePicker(true)}
              >
                <BlurView intensity={20} style={styles.routeButtonBlur}>
                  <Ionicons name="search" size={20} color={FlowColors.primary} />
                  <View style={styles.routeButtonContent}>
                    {selectedRoute ? (
                      <>
                        <Text style={styles.routeButtonTitle}>{selectedRoute.description}</Text>
                        <Text style={styles.routeButtonSubtitle}>
                          {selectedRoute.origin} → {selectedRoute.destination}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.routeButtonPlaceholder}>Search for AI-supported routes</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Time Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Departure Time</Text>
              <TouchableOpacity
                style={styles.routeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <BlurView intensity={20} style={styles.routeButtonBlur}>
                  <Ionicons name="calendar" size={20} color="#10b981" />
                  <Text style={styles.routeButtonText}>
                    {selectedDate.toLocaleDateString()} at {selectedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Predict Button */}
            <TouchableOpacity
              style={styles.predictButton}
              onPress={getPrediction}
              disabled={isLoading || !selectedRoute}
            >
              <LinearGradient
                colors={[FlowColors.primary, '#0c7db8']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Analyzing Traffic...</Text>
                ) : (
                  <>
                    <Ionicons name="analytics" size={20} color="white" />
                    <Text style={styles.buttonText}>Get AI Prediction</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Prediction Results */}
          {prediction && (
            <View style={styles.predictionContainer}>
              {/* Current Prediction */}
              <View style={styles.currentTrafficCard}>
                <BlurView intensity={20} style={styles.cardBlur}>
                  <View style={styles.cardHeader}>
                    <Ionicons 
                      name={prediction.currentTraffic.shouldGo ? "checkmark-circle" : "close-circle"} 
                      size={24} 
                      color={prediction.currentTraffic.shouldGo ? "#10b981" : "#ef4444"} 
                    />
                    <Text style={styles.cardTitle}>ML Prediction</Text>
                  </View>
                  <View style={styles.trafficDetails}>
                    <Text style={[styles.trafficLevel, { 
                      color: prediction.currentTraffic.shouldGo ? "#10b981" : "#ef4444" 
                    }]}>
                      {prediction.currentTraffic.shouldGo ? "GOOD TO GO" : "WAIT"}
                    </Text>
                    <Text style={styles.confidence}>
                      {prediction.currentTraffic.confidence.toFixed(1)}% confidence
                    </Text>
                  </View>
                </BlurView>
              </View>

              {/* Recommendation */}
              <View style={styles.recommendationCard}>
                <BlurView intensity={20} style={styles.cardBlur}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="bulb" size={24} color="#f59e0b" />
                    <Text style={styles.cardTitle}>AI Recommendation</Text>
                  </View>
                  <Text style={styles.recommendationText}>
                    {prediction.recommendation.reason}
                  </Text>
                </BlurView>
              </View>

              {/* Action Button */}
              {prediction.recommendation.shouldLeaveNow && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/simple-carpool' as any)}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="car" size={20} color="white" />
                    <Text style={styles.buttonText}>Find Carpool Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Modals */}
        <MLRoutePicker
          visible={showRoutePicker}
          onRouteSelect={handleRouteSelect}
          onClose={() => setShowRoutePicker(false)}
          title="Select Route for AI Prediction"
          mode="full-route"
        />

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setSelectedDate(date);
                setShowTimePicker(true);
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowTimePicker(false);
              if (date) {
                const newDate = new Date(selectedDate);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setSelectedDate(newDate);
              }
            }}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f14',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: -28,
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  routeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  routeButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeButtonContent: {
    flex: 1,
  },
  routeButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  routeButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  routeButtonText: {
    fontSize: 16,
    color: 'white',
  },
  routeButtonPlaceholder: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  predictButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  predictionContainer: {
    padding: 20,
    gap: 20,
  },
  currentTrafficCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  trafficDetails: {
    alignItems: 'center',
    gap: 8,
  },
  trafficLevel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  duration: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  confidence: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  futureTrafficCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  slotsScroll: {
    marginTop: 16,
  },
  trafficSlot: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  slotTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  slotIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  slotDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  slotSavings: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  recommendationCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  recommendationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 16,
  },
  bestTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestTimeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bestTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default FutureTrafficScreen;