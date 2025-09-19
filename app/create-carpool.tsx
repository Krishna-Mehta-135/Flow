import DelhiNCRLocationPicker from '@/components/DelhiNCRLocationPicker';
import GradientCard from '@/components/ui/GradientCard';
import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import carpoolService from '@/services/carpoolService';
import { DelhiNCRLocation } from '@/services/delhiNCRLocationService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function CreateCarpoolScreen() {
  const { user } = useAuth();
  const [fromLocation, setFromLocation] = useState<LocationData | null>(null);
  const [toLocation, setToLocation] = useState<LocationData | null>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('4');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleLocationSelect = (location: DelhiNCRLocation, isPickup: boolean) => {
    const locationData = {
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      address: `${location.name}, ${location.area}`
    };
    
    if (isPickup) {
      setFromLocation(locationData);
      setFromAddress(locationData.address || '');
      setShowFromPicker(false);
    } else {
      setToLocation(locationData);
      setToAddress(locationData.address || '');
      setShowToPicker(false);
    }
  };

  const handleCreateCarpool = async () => {
    if (!fromLocation || !toLocation || !departureTime || !pricePerSeat) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const carpoolData = {
        startLocation: fromLocation,
        endLocation: toLocation,
        departureTime: departureTime,
        availableSeats: parseInt(availableSeats),
        pricePerSeat: parseFloat(pricePerSeat),
      };

      await carpoolService.createCarpool(carpoolData);
      Alert.alert('Success', 'Carpool created successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/carpools') }
      ]);
    } catch (error) {
      console.error('Create carpool error:', error);
      Alert.alert('Error', 'Failed to create carpool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={FlowColors.backgroundDark} />
      
      <LinearGradient
        colors={[FlowColors.backgroundDark, '#1f2937']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a ride</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Location Inputs */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.locationInput}
              onPress={() => setShowFromPicker(true)}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons name="radio-button-on" size={20} color={FlowColors.primary} />
              </View>
              <TextInput
                style={styles.inputText}
                placeholder="From where?"
                placeholderTextColor="#9ca3af"
                value={fromAddress}
                editable={false}
              />
              <Ionicons name="search" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationInput}
              onPress={() => setShowToPicker(true)}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons name="location" size={20} color="#f59e0b" />
              </View>
              <TextInput
                style={styles.inputText}
                placeholder="Where to?"
                placeholderTextColor="#9ca3af"
                value={toAddress}
                editable={false}
              />
              <Ionicons name="search" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Time and Details */}
          <View style={styles.detailsContainer}>
            <GradientCard variant="glass" style={styles.inputCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={20} color={FlowColors.primary} />
                <Text style={styles.cardTitle}>When?</Text>
              </View>
              <TextInput
                style={styles.cardInput}
                placeholder="Departure time (e.g., 2024-12-20T09:00:00Z)"
                placeholderTextColor="#6b7280"
                value={departureTime}
                onChangeText={setDepartureTime}
              />
            </GradientCard>

            <GradientCard variant="glass" style={styles.inputCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={20} color={FlowColors.primary} />
                <Text style={styles.cardTitle}>Available Seats</Text>
              </View>
              <TextInput
                style={styles.cardInput}
                placeholder="Number of seats"
                placeholderTextColor="#6b7280"
                value={availableSeats}
                onChangeText={setAvailableSeats}
                keyboardType="numeric"
              />
            </GradientCard>

            <GradientCard variant="glass" style={styles.inputCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet" size={20} color={FlowColors.primary} />
                <Text style={styles.cardTitle}>Price per Seat (₹)</Text>
              </View>
              <TextInput
                style={styles.cardInput}
                placeholder="Price per passenger"
                placeholderTextColor="#6b7280"
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
                keyboardType="numeric"
              />
            </GradientCard>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreateCarpool}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[FlowColors.primary, '#0d7aa7']}
              style={styles.createButtonGradient}
            >
              {isLoading ? (
                <Text style={styles.createButtonText}>Creating...</Text>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <Text style={styles.createButtonText}>Create Carpool</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Location Picker Modals */}
        <Modal
          visible={showFromPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFromPicker(false)}
        >
          <BlurView intensity={100} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DelhiNCRLocationPicker
                visible={showFromPicker}
                onLocationSelect={(location) => handleLocationSelect(location, true)}
                onClose={() => setShowFromPicker(false)}
                title="Select pickup location"
                placeholder="Search pickup location..."
              />
            </View>
          </BlurView>
        </Modal>

        <Modal
          visible={showToPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowToPicker(false)}
        >
          <BlurView intensity={100} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DelhiNCRLocationPicker
                visible={showToPicker}
                onLocationSelect={(location) => handleLocationSelect(location, false)}
                onClose={() => setShowToPicker(false)}
                title="Select destination"
                placeholder="Search destination..."
              />
            </View>
          </BlurView>
        </Modal>
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
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginRight: 40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 32,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIconContainer: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  detailsContainer: {
    marginBottom: 32,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginLeft: 8,
  },
  cardInput: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    paddingVertical: 8,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: FlowColors.backgroundDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
});
