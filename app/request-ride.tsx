import carpoolService, { CreateRideRequestData } from '@/services/carpoolService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import DelhiNCRLocationPicker from '@/components/DelhiNCRLocationPicker';
import delhiNCRLocationService, { DelhiNCRLocation } from '@/services/delhiNCRLocationService';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface RecentLocation {
  address: string;
  description: string;
}

export default function RequestRideScreen() {
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDropoffPicker, setShowDropoffPicker] = useState(false);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [dropoffModalVisible, setDropoffModalVisible] = useState(false);

  const recentLocations: RecentLocation[] = [
    { address: '456 Oak Ave', description: 'Anytown, USA' },
    { address: '789 Pine St', description: 'Anytown, USA' },
  ];

  // Location picker handlers
  const handlePickupPress = () => {
    setPickupModalVisible(true);
  };

  const handleDropoffPress = () => {
    setDropoffModalVisible(true);
  };

  const handlePickupLocationSelect = (selectedLocation: DelhiNCRLocation) => {
    const address = `${selectedLocation.name}, ${selectedLocation.area}, ${selectedLocation.city}`;
    setPickupAddress(address);
    setPickupLocation({
      latitude: selectedLocation.coordinates.latitude,
      longitude: selectedLocation.coordinates.longitude,
      address: address,
    });
    setPickupModalVisible(false);
  };

  const handleDropoffLocationSelect = (selectedLocation: DelhiNCRLocation) => {
    const address = `${selectedLocation.name}, ${selectedLocation.area}, ${selectedLocation.city}`;
    setDropoffAddress(address);
    setDropoffLocation({
      latitude: selectedLocation.coordinates.latitude,
      longitude: selectedLocation.coordinates.longitude,
      address: address,
    });
    setDropoffModalVisible(false);
  };  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide accurate pickup suggestions and help other carpool members find you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Allow', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        // Set default to Delhi center if no permission
        const delhiBounds = delhiNCRLocationService.getDelhiNCRBounds();
        setCurrentLocation({
          latitude: delhiBounds.center.latitude,
          longitude: delhiBounds.center.longitude,
          address: 'Delhi, India'
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = addresses[0]
        ? `${addresses[0].street || ''} ${addresses[0].city || ''} ${addresses[0].region || ''}`.trim()
        : 'Current Location';

      const currentPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
      };
      
      setCurrentLocation(currentPos);
      
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to Delhi center
      const delhiBounds = delhiNCRLocationService.getDelhiNCRBounds();
      setCurrentLocation({
        latitude: delhiBounds.center.latitude,
        longitude: delhiBounds.center.longitude,
        address: 'Delhi, India'
      });
    }
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    // Only allow setting dropoff if pickup is already set
    if (pickupLocation && !dropoffLocation) {
      setDropoffLocation({ ...coordinate, address: 'Selected Location' });
      setDropoffAddress('Selected Location');
    }
  };

  const handleRequestRide = async () => {
    // Validate all required fields
    if (!pickupLocation) {
      Alert.alert('Missing Pickup Location', 'Please select a pickup location');
      return;
    }

    if (!dropoffLocation) {
      Alert.alert('Missing Drop-off Location', 'Please select a drop-off location');
      return;
    }

    if (!requestedTime) {
      Alert.alert('Missing Time', 'Please select when you need the ride');
      return;
    }

    // Parse the requested time
    const now = new Date();
    const [hours, minutes] = requestedTime.split(':');
    const requestDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
      parseInt(hours), parseInt(minutes));

    // If time is in the past, assume it's for tomorrow
    if (requestDate <= now) {
      requestDate.setDate(requestDate.getDate() + 1);
    }

    const requestData: CreateRideRequestData = {
      source: {
        lat: pickupLocation.latitude,
        lng: pickupLocation.longitude,
        address: pickupAddress,
      },
      destination: {
        lat: dropoffLocation.latitude,
        lng: dropoffLocation.longitude,
        address: dropoffAddress,
      },
      time: requestDate.toISOString(),
    };

    try {
      setIsLoading(true);
      await carpoolService.createRideRequest(requestData);
      Alert.alert('Success', 'Ride request created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectRecentLocation = (location: RecentLocation) => {
    const lat = 37.7749 + (Math.random() - 0.5) * 0.1;
    const lng = -122.4194 + (Math.random() - 0.5) * 0.1;
    
    const locationData = {
      latitude: lat,
      longitude: lng,
      address: location.address,
    };

    setDropoffLocation(locationData);
    setDropoffAddress(location.address);
  };

  const setQuickTime = (minutes: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setRequestedTime(timeString);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111c22" />
      
      {/* Map Background */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        onPress={handleMapPress}
        initialRegion={{
          latitude: currentLocation?.latitude || 37.7749,
          longitude: currentLocation?.longitude || -122.4194,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#1193d4"
          />
        )}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup"
            pinColor="#1193d4"
          />
        )}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Drop-off"
            pinColor="#ff4444"
          />
        )}
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <BlurView intensity={80} style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request a ride</Text>
        </BlurView>
      </SafeAreaView>

      {/* Location Input Panel */}
      <View style={styles.locationPanel}>
        <BlurView intensity={80} style={styles.locationContent}>
          {/* Pickup Input */}
          <TouchableOpacity 
            style={styles.locationInputContainer}
            onPress={handlePickupPress}
          >
            <View style={styles.locationIconContainer}>
              <Ionicons name="locate" size={20} color="#1193d4" />
            </View>
            <View style={styles.locationInput}>
              <Text style={[
                styles.locationText,
                !pickupAddress && styles.placeholderText
              ]}>
                {pickupAddress || "Pickup location"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Dropoff Input */}
          <TouchableOpacity 
            style={styles.locationInputContainer}
            onPress={handleDropoffPress}
          >
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={20} color="#ff4444" />
            </View>
            <View style={styles.locationInput}>
              <Text style={[
                styles.locationText,
                !dropoffAddress && styles.placeholderText
              ]}>
                {dropoffAddress || "Drop-off location"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Time Input */}
          <View style={styles.locationInputContainer}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="time" size={20} color="#1193d4" />
            </View>
            <TextInput
              style={styles.locationInput}
              placeholder="Time (HH:MM)"
              placeholderTextColor="#92b7c9"
              value={requestedTime}
              onChangeText={setRequestedTime}
              keyboardType="numeric"
            />
          </View>

          {/* Quick Time Options */}
          <View style={styles.quickTimeContainer}>
            <TouchableOpacity 
              style={styles.quickTimeButton} 
              onPress={() => setQuickTime(15)}
            >
              <Text style={styles.quickTimeText}>Now +15m</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickTimeButton} 
              onPress={() => setQuickTime(30)}
            >
              <Text style={styles.quickTimeText}>Now +30m</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickTimeButton} 
              onPress={() => setQuickTime(60)}
            >
              <Text style={styles.quickTimeText}>Now +1h</Text>
            </TouchableOpacity>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Recent Locations */}
          <ScrollView style={styles.recentLocations} showsVerticalScrollIndicator={false}>
            {recentLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentLocationItem}
                onPress={() => selectRecentLocation(location)}
              >
                <Ionicons name="location-outline" size={20} color="#92b7c9" />
                <View style={styles.recentLocationText}>
                  <Text style={styles.recentLocationAddress}>{location.address}</Text>
                  <Text style={styles.recentLocationDescription}>{location.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      </View>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <LinearGradient
          colors={['transparent', '#111c22']}
          style={styles.bottomGradient}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.requestButton, isLoading && styles.requestButtonDisabled]}
            onPress={handleRequestRide}
            disabled={isLoading || !pickupLocation || !dropoffLocation || !requestedTime}
          >
            <Text style={styles.requestButtonText}>
              {isLoading ? 'Processing...' : 'See route & request'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Picker Modals */}
      <DelhiNCRLocationPicker
        visible={pickupModalVisible}
        onLocationSelect={handlePickupLocationSelect}
        onClose={() => setPickupModalVisible(false)}
        title="Select Pickup Location"
        placeholder="Search pickup location..."
      />
      
      <DelhiNCRLocationPicker
        visible={dropoffModalVisible}
        onLocationSelect={handleDropoffLocationSelect}
        onClose={() => setDropoffModalVisible(false)}
        title="Select Drop-off Location"
        placeholder="Search drop-off location..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111c22',
  },
  map: {
    width: width,
    height: height,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(17, 28, 34, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(35, 60, 72, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 56,
  },
  locationPanel: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    maxHeight: height * 0.5,
    zIndex: 10,
  },
  locationContent: {
    backgroundColor: 'rgba(17, 28, 34, 0.9)',
    borderRadius: 16,
    padding: 16,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#233c48',
    borderRadius: 12,
    marginBottom: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  locationIconContainer: {
    marginRight: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  separator: {
    height: 1,
    backgroundColor: '#233c48',
    marginVertical: 8,
  },
  recentLocations: {
    maxHeight: 200,
  },
  recentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  recentLocationText: {
    marginLeft: 12,
    flex: 1,
  },
  recentLocationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  recentLocationDescription: {
    fontSize: 14,
    color: '#92b7c9',
    marginTop: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomGradient: {
    height: 80,
  },
  buttonContainer: {
    backgroundColor: '#111c22',
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 16,
  },
  requestButton: {
    backgroundColor: '#1193d4',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButtonDisabled: {
    backgroundColor: '#666',
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  quickTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  quickTimeButton: {
    backgroundColor: '#233c48',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickTimeText: {
    color: '#92b7c9',
    fontSize: 12,
    fontWeight: '500',
  },
  locationText: {
    color: 'white',
    fontSize: 16,
  },
  placeholderText: {
    color: '#92b7c9',
  },
});
