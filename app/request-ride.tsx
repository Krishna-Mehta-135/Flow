import { IconSymbol } from '@/components/ui/IconSymbol';
import carpoolService, { CreateRideRequestData } from '@/services/carpoolService';
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

export default function RequestRideScreen() {
  const [startLatitude, setStartLatitude] = useState('');
  const [startLongitude, setStartLongitude] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [endLatitude, setEndLatitude] = useState('');
  const [endLongitude, setEndLongitude] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestRide = async () => {
    // Validate inputs
    if (!startLatitude || !startLongitude || !endLatitude || !endLongitude) {
      Alert.alert('Error', 'Please fill in all location coordinates');
      return;
    }

    if (!requestedTime) {
      Alert.alert('Error', 'Please specify the requested time');
      return;
    }

    // Parse requested time (for simplicity, we'll use current date + time)
    const now = new Date();
    const [hours, minutes] = requestedTime.split(':');
    const requestDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
      parseInt(hours), parseInt(minutes));

    if (requestDate <= now) {
      requestDate.setDate(requestDate.getDate() + 1); // Next day if time has passed
    }

    const requestData: CreateRideRequestData = {
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
      requestedTime: requestDate.toISOString(),
    };

    try {
      setIsLoading(true);
      await carpoolService.createRideRequest(requestData);
      Alert.alert('Success', 'Ride request created successfully! We\'ll notify you when a match is found.', [
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
          <Text style={styles.title}>Request a Ride</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
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
            <Text style={styles.sectionTitle}>Drop-off Location</Text>
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
            <Text style={styles.sectionTitle}>Timing</Text>
            <TextInput
              style={styles.input}
              placeholder="Requested Time (HH:MM)"
              value={requestedTime}
              onChangeText={setRequestedTime}
            />
            <View style={styles.infoContainer}>
              <IconSymbol name="info.circle" size={16} color="#007AFF" />
              <Text style={styles.infoText}>
                We'll match you with available carpools and notify you when found.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.requestButton, isLoading && styles.requestButtonDisabled]}
            onPress={handleRequestRide}
            disabled={isLoading}
          >
            <Text style={styles.requestButtonText}>
              {isLoading ? 'Creating Request...' : 'Request Ride'}
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  requestButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  requestButtonDisabled: {
    backgroundColor: '#ccc',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});
