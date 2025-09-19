import delhiNCRLocationService, { DelhiNCRLocation } from '@/services/delhiNCRLocationService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface DelhiNCRLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: DelhiNCRLocation) => void;
  title: string;
  placeholder: string;
}

export default function DelhiNCRLocationPicker({
  visible,
  onClose,
  onLocationSelect,
  title,
  placeholder
}: DelhiNCRLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DelhiNCRLocation[]>([]);
  const [popularLocations, setPopularLocations] = useState<DelhiNCRLocation[]>([]);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      setPopularLocations(delhiNCRLocationService.getPopularLocations());
      getCurrentLocation();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = delhiNCRLocationService.searchLocations(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const address = addresses[0]
          ? `${addresses[0].street || ''} ${addresses[0].city || ''} ${addresses[0].region || ''}`.trim()
          : `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address || 'Current Location',
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLocationPress = (location: DelhiNCRLocation) => {
    onLocationSelect(location);
    onClose();
  };

  const handleCurrentLocationPress = () => {
    if (userLocation) {
      // Convert current location to DelhiNCRLocation format
      const currentLocationAsDelhi: DelhiNCRLocation = {
        name: 'Current Location',
        area: userLocation.address || 'Unknown Area',
        city: 'Delhi',
        state: 'Delhi',
        coordinates: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        type: 'landmark',
      };
      onLocationSelect(currentLocationAsDelhi);
      onClose();
    }
  };

  const renderLocationItem = ({ item }: { item: DelhiNCRLocation }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationPress(item)}
    >
      <View style={styles.locationIcon}>
        <Ionicons 
          name={getLocationIcon(item.type)} 
          size={20} 
          color="#1193d4" 
        />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationDetails}>
          {item.area}, {item.city}, {item.state}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#92b7c9" />
    </TouchableOpacity>
  );

  const getLocationIcon = (type: DelhiNCRLocation['type']) => {
    switch (type) {
      case 'metro_station': return 'train';
      case 'airport': return 'airplane';
      case 'mall': return 'storefront';
      case 'hospital': return 'medical';
      case 'university': return 'school';
      case 'landmark': return 'location';
      case 'residential': return 'home';
      default: return 'location';
    }
  };

  const getTypeLabel = (type: DelhiNCRLocation['type']) => {
    switch (type) {
      case 'metro_station': return 'Metro';
      case 'airport': return 'Airport';
      case 'mall': return 'Mall';
      case 'hospital': return 'Hospital';
      case 'university': return 'University';
      case 'landmark': return 'Landmark';
      case 'residential': return 'Area';
      default: return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <BlurView intensity={80} style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.placeholder} />
          </BlurView>
        </SafeAreaView>

        <View style={styles.content}>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#92b7c9" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#92b7c9"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#92b7c9" />
              </TouchableOpacity>
            )}
          </View>

          {/* Current Location */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleCurrentLocationPress}
            disabled={!userLocation || isLoadingLocation}
          >
            <View style={styles.currentLocationIcon}>
              <Ionicons 
                name={isLoadingLocation ? "refresh" : "locate"} 
                size={20} 
                color="white" 
              />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.currentLocationText}>
                {isLoadingLocation ? 'Getting location...' : 'Use current location'}
              </Text>
              {userLocation && (
                <Text style={styles.locationDetails}>{userLocation.address}</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Search Results or Popular Locations */}
          <FlatList
            data={searchQuery.length >= 2 ? searchResults : popularLocations}
            renderItem={renderLocationItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <Text style={styles.sectionTitle}>
                {searchQuery.length >= 2 ? 'Search Results' : 'Popular Locations'}
              </Text>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={48} color="#92b7c9" />
                <Text style={styles.emptyText}>
                  {searchQuery.length >= 2 
                    ? 'No locations found' 
                    : 'Start typing to search locations'
                  }
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111c22',
  },
  header: {
    backgroundColor: 'rgba(17, 28, 34, 0.95)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(17, 28, 34, 0.9)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    paddingVertical: 16,
    fontFamily: 'Space Grotesk',
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1193d4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  currentLocationIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92b7c9',
    marginBottom: 12,
    fontFamily: 'Space Grotesk',
  },
  list: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  locationIcon: {
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 14,
    color: '#92b7c9',
    fontFamily: 'Space Grotesk',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#92b7c9',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'Space Grotesk',
  },
});