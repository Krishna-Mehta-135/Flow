import { IconSymbol } from '@/components/ui/IconSymbol';
import carpoolService, { CreateCarpoolData } from '@/services/carpoolService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateCarpoolScreen() {
  const [startLatitude, setStartLatitude] = useState('');
  const [startLongitude, setStartLongitude] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [endLatitude, setEndLatitude] = useState('');
  const [endLongitude, setEndLongitude] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCarpool = async () => {
    // Validate inputs
    if (!startLatitude || !startLongitude || !endLatitude || !endLongitude) {
      Alert.alert('Error', 'Please fill in all location coordinates');
      return;
    }

    if (!departureTime || !availableSeats || !pricePerSeat) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(Number(availableSeats)) || Number(availableSeats) < 1 || Number(availableSeats) > 8) {
      Alert.alert('Error', 'Available seats must be a number between 1 and 8');
      return;
    }

    if (isNaN(Number(pricePerSeat)) || Number(pricePerSeat) < 0) {
      Alert.alert('Error', 'Price per seat must be a valid number');
      return;
    }

    // Parse departure time (for simplicity, we'll use current date + time)
    const now = new Date();
    const [hours, minutes] = departureTime.split(':');
    const departureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
      parseInt(hours), parseInt(minutes));

    if (departureDate <= now) {
      departureDate.setDate(departureDate.getDate() + 1); // Next day if time has passed
    }

    const carpoolData: CreateCarpoolData = {
      startLocation: {
        latitude: parseFloat(startLatitude),
        longitude: parseFloat(startLongitude),
        address: startAddress || undefined,
      },
      endLocation: {
        latitude: parseFloat(endLatitude),
        longitude: parseFloat(endLongitude),
        address: endAddress || undefined,
      },
      departureTime: departureDate.toISOString(),
      availableSeats: parseInt(availableSeats),
      pricePerSeat: parseFloat(pricePerSeat),
    };

    try {
      setIsLoading(true);
      await carpoolService.createCarpool(carpoolData);
      Alert.alert('Success', 'Carpool created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Carpool</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Starting Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Address (optional)"
              value={startAddress}
              onChangeText={setStartAddress}
            />
            <View style={styles.coordinateRow}>
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Latitude"
                value={startLatitude}
                onChangeText={setStartLatitude}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Longitude"
                value={startLongitude}
                onChangeText={setStartLongitude}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destination</Text>
            <TextInput
              style={styles.input}
              placeholder="Address (optional)"
              value={endAddress}
              onChangeText={setEndAddress}
            />
            <View style={styles.coordinateRow}>
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Latitude"
                value={endLatitude}
                onChangeText={setEndLatitude}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Longitude"
                value={endLongitude}
                onChangeText={setEndLongitude}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Departure Time (HH:MM)"
              value={departureTime}
              onChangeText={setDepartureTime}
            />
            <TextInput
              style={styles.input}
              placeholder="Available Seats"
              value={availableSeats}
              onChangeText={setAvailableSeats}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Price per Seat ($)"
              value={pricePerSeat}
              onChangeText={setPricePerSeat}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreateCarpool}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? 'Creating...' : 'Create Carpool'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    width: '48%',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});
