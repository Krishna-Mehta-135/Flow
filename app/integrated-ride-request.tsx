import MatchingScreen from '@/app/matching';
import DelhiNCRLocationPicker from '@/components/DelhiNCRLocationPicker';
import { FlowColors } from '@/constants/Colors';
import { DelhiNCRLocation } from '@/services/delhiNCRLocationService';
import transportationService, { TransportationOption, TransportationResponse } from '@/services/transportationService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type FlowStep = 'location' | 'transport-options' | 'matching' | 'completed';

const IntegratedRideRequestScreen = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>('location');
  
  // Location selection state
  const [fromLocation, setFromLocation] = useState<DelhiNCRLocation | null>(null);
  const [toLocation, setToLocation] = useState<DelhiNCRLocation | null>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  // Transportation state
  const [transportResponse, setTransportResponse] = useState<TransportationResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<TransportationOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Matching state
  const [transportId, setTransportId] = useState<string | null>(null);

  const handleFromLocationSelect = (locationData: DelhiNCRLocation) => {
    if (locationData) {
      setFromLocation(locationData);
      setFromAddress(`${locationData.name}, ${locationData.area}`);
      setShowFromPicker(false);
    }
  };

  const handleToLocationSelect = (locationData: DelhiNCRLocation) => {
    if (locationData) {
      setToLocation(locationData);
      setToAddress(`${locationData.name}, ${locationData.area}`);
      setShowToPicker(false);
    }
  };

  const handleGetTransportOptions = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please select both pickup and destination locations');
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        source: {
          lat: fromLocation.coordinates.latitude,
          lng: fromLocation.coordinates.longitude,
          address: `${fromLocation.name}, ${fromLocation.area}`,
        },
        destination: {
          lat: toLocation.coordinates.latitude,
          lng: toLocation.coordinates.longitude,
          address: `${toLocation.name}, ${toLocation.area}`,
        },
        requestedTime: new Date().toISOString(), // Current time for immediate travel
        passengerCount: 1,
      };

      const response = await transportationService.getTransportationOptions(request);
      setTransportResponse(response);
      setCurrentStep('transport-options');
    } catch (error) {
      console.error('Get transport options error:', error);
      Alert.alert('Error', 'Failed to get transport options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTransportOption = async (option: TransportationOption) => {
    if (!transportResponse) return;

    setSelectedOption(option);
    setIsLoading(true);

    try {
      const selectionResponse = await transportationService.selectTransportationOption(
        transportResponse.requestId,
        option.id
      );

      setTransportId(selectionResponse.transportId);

      if (option.type === 'carpool') {
        // Show matching screen for carpool
        setCurrentStep('matching');
      } else {
        // For other transport types, show success and navigate
        Alert.alert(
          'Transportation Booked',
          `Your ${option.type} has been booked successfully!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Select transport option error:', error);
      Alert.alert('Error', 'Failed to book transportation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchingComplete = () => {
    setCurrentStep('completed');
    // Navigate to carpool details or back to main screen
    router.push('/carpool-details');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'transport-options':
        setCurrentStep('location');
        break;
      case 'matching':
        setCurrentStep('transport-options');
        break;
      default:
        router.back();
    }
  };

  const renderLocationSelection = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Ride</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Location inputs */}
      <View style={styles.formContainer}>
        {/* From Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowFromPicker(true)}
          >
            <BlurView intensity={20} style={styles.locationButtonBlur}>
              <Ionicons name="radio-button-on" size={20} color={FlowColors.primary} />
              <Text style={styles.locationButtonText}>
                {fromAddress || 'Select pickup location'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* To Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>To</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowToPicker(true)}
          >
            <BlurView intensity={20} style={styles.locationButtonBlur}>
              <Ionicons name="location" size={20} color="#ff4757" />
              <Text style={styles.locationButtonText}>
                {toAddress || 'Select destination'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Get Options Button */}
        <TouchableOpacity
          style={styles.getOptionsButton}
          onPress={handleGetTransportOptions}
          disabled={isLoading || !fromLocation || !toLocation}
        >
          <LinearGradient
            colors={['#1193d4', '#0c7db8']}
            style={styles.buttonGradient}
          >
            {isLoading ? (
              <Text style={styles.buttonText}>Getting options...</Text>
            ) : (
              <>
                <Ionicons name="options" size={20} color="white" />
                <Text style={styles.buttonText}>Get Transport Options</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Location Pickers */}
      <Modal visible={showFromPicker} animationType="slide" presentationStyle="pageSheet">
        <DelhiNCRLocationPicker
          visible={showFromPicker}
          onLocationSelect={handleFromLocationSelect}
          onClose={() => setShowFromPicker(false)}
          title="Select Pickup Location"
          placeholder="Search pickup location..."
        />
      </Modal>

      <Modal visible={showToPicker} animationType="slide" presentationStyle="pageSheet">
        <DelhiNCRLocationPicker
          visible={showToPicker}
          onLocationSelect={handleToLocationSelect}
          onClose={() => setShowToPicker(false)}
          title="Select Destination"
          placeholder="Search destination..."
        />
      </Modal>
    </ScrollView>
  );

  const renderTransportOptions = () => {
    if (!transportResponse) return null;

    // Convert backend transport options to frontend format
    const convertedOptions = transportResponse.options.map(option => ({
      id: option.id,
      type: option.type,
      title: option.type === 'carpool' ? 'Shared Carpool' : 
             option.type === 'metro' ? 'Metro' :
             option.type === 'taxi' ? 'Private Taxi' : 
             option.type === 'bus' ? 'Bus' :
             option.type === 'auto' ? 'Auto-rickshaw' : 'Walking',
      subtitle: option.description,
      time: `${option.estimatedTime} min`,
      price: `₹${option.estimatedCost}`,
      icon: option.icon,
      selected: false,
      mlPrediction: {
        trafficLevel: option.trafficLevel,
        confidence: option.confidence,
      }
    }));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transport Options</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.optionsContainer}>
          {transportResponse.mlRecommendation && (
            <View style={styles.recommendationCard}>
              <BlurView intensity={20} style={styles.recommendationBlur}>
                <Ionicons name="bulb" size={24} color="#1193d4" />
                <Text style={styles.recommendationText}>
                  {transportResponse.mlRecommendation}
                </Text>
              </BlurView>
            </View>
          )}

          {convertedOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleSelectTransportOption(transportResponse.options.find(o => o.id === option.id)!)}
              disabled={isLoading}
            >
              <BlurView intensity={20} style={styles.optionBlur}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionIcon}>
                    <Ionicons name={option.icon as any} size={24} color="#1193d4" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <View style={styles.optionPricing}>
                    <Text style={styles.optionPrice}>{option.price}</Text>
                    <Text style={styles.optionTime}>{option.time}</Text>
                  </View>
                </View>

                {option.mlPrediction && (
                  <View style={[
                    styles.trafficIndicator,
                    { backgroundColor: getTrafficColor(option.mlPrediction.trafficLevel) + '20' }
                  ]}>
                    <Text style={[
                      styles.trafficText,
                      { color: getTrafficColor(option.mlPrediction.trafficLevel) }
                    ]}>
                      {option.mlPrediction.trafficLevel.toUpperCase()} TRAFFIC
                    </Text>
                    <Text style={styles.confidenceText}>
                      {Math.round(option.mlPrediction.confidence * 100)}% confidence
                    </Text>
                  </View>
                )}
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderMatching = () => {
    if (!fromLocation || !toLocation) return null;

    return (
      <MatchingScreen
        pickupLocation={`${fromLocation.name}, ${fromLocation.area}`}
        destination={`${toLocation.name}, ${toLocation.area}`}
        onBack={handleBack}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />
      
      <LinearGradient
        colors={['#0a0f14', '#1a1f2e', '#0a0f14']}
        style={styles.gradient}
      >
        {currentStep === 'location' && renderLocationSelection()}
        {currentStep === 'transport-options' && renderTransportOptions()}
        {currentStep === 'matching' && renderMatching()}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
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
  locationButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  locationButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationButtonText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  getOptionsButton: {
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
  optionsContainer: {
    flex: 1,
    padding: 20,
  },
  recommendationCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recommendationBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(17, 147, 212, 0.2)',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  optionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  optionPricing: {
    alignItems: 'flex-end',
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1193d4',
    marginBottom: 2,
  },
  optionTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  trafficIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trafficText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default IntegratedRideRequestScreen;