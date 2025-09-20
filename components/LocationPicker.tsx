import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
  TextInput
} from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  title?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onDismiss,
  onLocationSelect,
  initialLocation,
  title = 'Select Location',
}) => {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);

  useEffect(() => {
    if (visible) {
      requestLocationPermission();
    }
  }, [visible]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to help you find nearby locations.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      }).catch((error) => {
        console.warn('Reverse geocoding failed:', error);
        return []; // Return empty array as fallback
      });

      const address = addresses && addresses[0]
        ? `${addresses[0].street || ''} ${addresses[0].city || ''} ${addresses[0].region || ''}`.trim()
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const locationData: LocationData = {
        latitude,
        longitude,
        address,
      };

      setCurrentLocation(locationData);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const geocoded = await Location.geocodeAsync(query);
      const results: LocationData[] = geocoded.map((result) => ({
        latitude: result.latitude,
        longitude: result.longitude,
        address: query,
      }));
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setCurrentLocation(location);
    setSearchResults([]);
    setSearchText(location.address || `${location.latitude}, ${location.longitude}`);
  };

  const handleConfirm = () => {
    if (currentLocation) {
      onLocationSelect(currentLocation);
      onDismiss();
    } else {
      Alert.alert('Error', 'Please select a location');
    }
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Manual Coordinates',
      'Enter latitude and longitude (e.g., 40.7128, -74.0060)',
      (text) => {
        if (text) {
          const coords = text.split(',').map(coord => parseFloat(coord.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const location: LocationData = {
              latitude: coords[0],
              longitude: coords[1],
              address: `${coords[0]}, ${coords[1]}`,
            };
            handleLocationSelect(location);
          } else {
            Alert.alert('Error', 'Invalid coordinates format');
          }
        }
      }
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {title}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              iconColor={theme.colors.onSurface}
            />
          </View>

          <TextInput
            label="Search location"
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              searchLocation(text);
            }}
            mode="outlined"
            style={styles.searchInput}
            right={
              <TextInput.Icon
                icon="magnify"
                onPress={() => searchLocation(searchText)}
              />
            }
          />

          {/* Map placeholder - would show actual map in production */}
          <Surface style={[styles.mapContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.mapPlaceholder}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                🗺️ Map View
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, textAlign: 'center', marginTop: 8 }}>
                {currentLocation
                  ? `Selected: ${currentLocation.address || `${currentLocation.latitude}, ${currentLocation.longitude}`}`
                  : 'No location selected'}
              </Text>
            </View>
          </Surface>

          {/* Search results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.slice(0, 3).map((result, index) => (
                <Button
                  key={index}
                  mode="outlined"
                  onPress={() => handleLocationSelect(result)}
                  style={styles.resultButton}
                >
                  {result.address}
                </Button>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={getCurrentLocation}
              loading={isLoadingLocation}
              style={styles.actionButton}
              icon="crosshairs-gps"
            >
              Current Location
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleManualEntry}
              style={styles.actionButton}
              icon="map-marker-plus"
            >
              Manual Entry
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={[styles.button, styles.cancelButton]}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={[styles.button, styles.confirmButton]}
              disabled={!currentLocation}
            >
              Confirm
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: height * 0.8,
  },
  container: {
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchResults: {
    marginBottom: 16,
  },
  resultButton: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {},
  confirmButton: {},
});
