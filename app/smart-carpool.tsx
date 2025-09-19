import DelhiNCRLocationPicker from '@/components/DelhiNCRLocationPicker';
import { FlowColors } from '@/constants/Colors';
import { DelhiNCRLocation } from '@/services/delhiNCRLocationService';
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
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CarpoolMatch {
  id: string;
  driver: {
    name: string;
    rating: number;
    photo: string;
    vehicle: string;
  };
  route: {
    pickup: string;
    destination: string;
    distance: number;
  };
  timing: {
    departureTime: string;
    estimatedArrival: string;
    flexibility: number; // minutes
  };
  cost: {
    perPerson: number;
    total: number;
    savings: number; // compared to solo ride
  };
  passengers: Array<{
    name: string;
    rating: number;
  }>;
  compatibility: {
    score: number; // 0-100
    factors: string[];
  };
  availability: {
    seatsLeft: number;
    total: number;
  };
}

const SmartCarpoolScreen = () => {
  const router = useRouter();
  
  // Location state
  const [fromLocation, setFromLocation] = useState<DelhiNCRLocation | null>(null);
  const [toLocation, setToLocation] = useState<DelhiNCRLocation | null>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  // Route state - using ML supported routes
  const [selectedRoute, setSelectedRoute] = useState<MLSupportedRoute | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  
  // Time state - default to 30 minutes from now for future carpools
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 30 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Matching state
  const [matches, setMatches] = useState<CarpoolMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const findCarpoolMatches = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please select both locations');
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
        requestedTime: selectedDate.toISOString(),
        passengerCount: 1,
      };

      // Get carpool options from backend
      const response = await transportationService.getTransportationOptions(request);
      const carpoolOption = response.options.find(opt => opt.type === 'carpool');
      
      if (carpoolOption) {
        // Generate mock carpool matches (in real app, this comes from backend)
        const mockMatches = generateMockMatches(carpoolOption, request);
        setMatches(mockMatches);
      } else {
        setMatches([]);
        Alert.alert('No Matches', 'No carpool matches found for this route and time.');
      }
    } catch (error) {
      console.error('Carpool search error:', error);
      Alert.alert('Error', 'Failed to find carpool matches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockMatches = (carpoolOption: TransportationOption, request: any): CarpoolMatch[] => {
    const mockDrivers = [
      { name: 'Rajesh Kumar', rating: 4.8, photo: 'https://i.pravatar.cc/150?img=1', vehicle: 'Honda City' },
      { name: 'Priya Sharma', rating: 4.9, photo: 'https://i.pravatar.cc/150?img=2', vehicle: 'Maruti Swift' },
      { name: 'Vikram Singh', rating: 4.7, photo: 'https://i.pravatar.cc/150?img=3', vehicle: 'Hyundai Creta' },
    ];

    return mockDrivers.map((driver, index) => ({
      id: `match_${index}`,
      driver,
      route: {
        pickup: request.source.address,
        destination: request.destination.address,
        distance: Math.round(Math.random() * 10 + 15), // 15-25 km
      },
      timing: {
        departureTime: new Date(Date.now() + (index * 15 * 60 * 1000)).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        estimatedArrival: new Date(Date.now() + ((index * 15 + carpoolOption.estimatedTime) * 60 * 1000)).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        flexibility: Math.round(Math.random() * 10 + 5), // 5-15 minutes
      },
      cost: {
        perPerson: Math.round(carpoolOption.estimatedCost + (Math.random() * 50 - 25)),
        total: Math.round(carpoolOption.estimatedCost * 2.5),
        savings: Math.round(carpoolOption.estimatedCost * 0.6),
      },
      passengers: [
        { name: 'Amit Kumar', rating: 4.6 },
        { name: 'Sneha Gupta', rating: 4.8 },
      ].slice(0, Math.floor(Math.random() * 3)),
      compatibility: {
        score: Math.round(Math.random() * 30 + 70), // 70-100
        factors: ['Similar commute time', 'Good ratings', 'Regular route'].slice(0, Math.floor(Math.random() * 3) + 1),
      },
      availability: {
        seatsLeft: Math.floor(Math.random() * 3) + 1,
        total: 4,
      },
    }));
  };

  const joinCarpool = (match: CarpoolMatch) => {
    Alert.alert(
      'Join Carpool',
      `Join ${match.driver.name}'s carpool for ₹${match.cost.perPerson}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            Alert.alert('Success', 'Carpool request sent! The driver will be notified.');
            // In real app, this would make an API call
          },
        },
      ]
    );
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#f59e0b';
    return '#ef4444';
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
          <Text style={styles.headerTitle}>🚗 Plan Carpool</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Location Selection */}
          <View style={styles.formContainer}>
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

            {/* Time Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Departure Time</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => setShowDatePicker(true)}
              >
                <BlurView intensity={20} style={styles.locationButtonBlur}>
                  <Ionicons name="calendar" size={20} color="#10b981" />
                  <Text style={styles.locationButtonText}>
                    {selectedDate.toLocaleDateString()} at {selectedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={findCarpoolMatches}
              disabled={isLoading || !fromLocation || !toLocation}
            >
              <LinearGradient
                colors={[FlowColors.primary, '#0c7db8']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Finding matches...</Text>
                ) : (
                  <>
                    <Ionicons name="search" size={20} color="white" />
                    <Text style={styles.buttonText}>Find Carpool Matches</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Carpool Matches */}
          {matches.length > 0 && (
            <View style={styles.matchesContainer}>
              <Text style={styles.matchesTitle}>
                {matches.length} Match{matches.length !== 1 ? 'es' : ''} Found
              </Text>
              
              {matches.map((match) => (
                <View key={match.id} style={styles.matchCard}>
                  <BlurView intensity={20} style={styles.matchBlur}>
                    {/* Driver Info */}
                    <View style={styles.driverSection}>
                      <View style={styles.driverInfo}>
                        <View style={styles.driverAvatar}>
                          <Text style={styles.driverInitials}>
                            {match.driver.name.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View style={styles.driverDetails}>
                          <Text style={styles.driverName}>{match.driver.name}</Text>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.rating}>{match.driver.rating}</Text>
                            <Text style={styles.vehicle}>• {match.driver.vehicle}</Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Compatibility Score */}
                      <View style={[styles.compatibilityBadge, { backgroundColor: getCompatibilityColor(match.compatibility.score) + '20' }]}>
                        <Text style={[styles.compatibilityScore, { color: getCompatibilityColor(match.compatibility.score) }]}>
                          {match.compatibility.score}%
                        </Text>
                      </View>
                    </View>

                    {/* Trip Details */}
                    <View style={styles.tripDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color="#1193d4" />
                        <Text style={styles.detailText}>
                          {match.timing.departureTime} → {match.timing.estimatedArrival}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="people" size={16} color="#10b981" />
                        <Text style={styles.detailText}>
                          {match.availability.seatsLeft} seat{match.availability.seatsLeft !== 1 ? 's' : ''} left • {match.passengers.length} passenger{match.passengers.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="cash" size={16} color="#f59e0b" />
                        <Text style={styles.detailText}>
                          ₹{match.cost.perPerson} per person • Save ₹{match.cost.savings}
                        </Text>
                      </View>
                    </View>

                    {/* Compatibility Factors */}
                    <View style={styles.compatibilityFactors}>
                      {match.compatibility.factors.map((factor, index) => (
                        <View key={index} style={styles.factorTag}>
                          <Text style={styles.factorText}>{factor}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => joinCarpool(match)}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.joinButtonGradient}
                      >
                        <Ionicons name="add-circle" size={18} color="white" />
                        <Text style={styles.joinButtonText}>Join Carpool</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </BlurView>
                </View>
              ))}
            </View>
          )}

          {/* No Matches State */}
          {matches.length === 0 && !isLoading && fromLocation && toLocation && (
            <View style={styles.noMatchesContainer}>
              <BlurView intensity={20} style={styles.noMatchesBlur}>
                <Ionicons name="car" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.noMatchesTitle}>No matches yet</Text>
                <Text style={styles.noMatchesText}>
                  Try adjusting your time or create your own carpool
                </Text>
                <TouchableOpacity
                  style={styles.createCarpoolButton}
                  onPress={() => router.push('/create-carpool')}
                >
                  <Text style={styles.createCarpoolButtonText}>Create Carpool</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          )}
        </ScrollView>

        {/* Modals */}
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
  searchButton: {
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
  matchesContainer: {
    padding: 20,
  },
  matchesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
  },
  matchCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  matchBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  driverSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: FlowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
  vehicle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  compatibilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  compatibilityScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  tripDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  compatibilityFactors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  factorTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  factorText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  noMatchesContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  noMatchesBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 40,
    alignItems: 'center',
  },
  noMatchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  noMatchesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  createCarpoolButton: {
    backgroundColor: FlowColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createCarpoolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default SmartCarpoolScreen;