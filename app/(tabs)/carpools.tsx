import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Pool {
  _id: string;
  members: Member[];
  rideRequests: any[];
  pickupZone: {
    lat: number;
    lng: number;
  };
  departureTime: string;
  costPerUser: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface Member {
  _id: string;
  username: string;
  email: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export default function CarpoolsScreen() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [memberLocations, setMemberLocations] = useState<{[key: string]: UserLocation}>({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadPools();
      requestLocationPermission();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (userLocation && selectedPool) {
      updateUserLocation();
    }
  }, [userLocation, selectedPool]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Start watching location for real-time updates
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
            });
          }
        );
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show your position to other carpool members for safety and coordination.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
    }
  };

  const updateUserLocation = async () => {
    if (!userLocation || !selectedPool) return;
    
    try {
      const token = await authService.getToken();
      if (!token) return;

      await fetch(`http://10.6.192.157:9898/api/carpool/update-location/${selectedPool._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const loadMemberLocations = async (poolId: string) => {
    try {
      const token = await authService.getToken();
      if (!token) return;

      const response = await fetch(`http://10.6.192.157:9898/api/carpool/member-locations/${poolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const locations: {[key: string]: UserLocation} = {};
        data.data.forEach((member: any) => {
          if (member.location) {
            locations[member._id] = {
              latitude: member.location.latitude,
              longitude: member.location.longitude,
            };
          }
        });
        setMemberLocations(locations);
      }
    } catch (error) {
      console.error('Error loading member locations:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPools();
    }
  }, [activeTab, isAuthenticated]);

  const loadPools = async () => {
    try {
      setIsLoading(true);
      const token = await authService.getToken();
      
      if (!token) {
        console.log('No auth token found');
        setPools([]);
        return;
      }

      // Get user's active pools
      const response = await fetch('http://10.6.192.157:9898/api/carpool/user-pools', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPools(data.data || []);
      } else {
        // If no pools or error, show empty state
        setPools([]);
      }
    } catch (error: any) {
      console.error('Error loading pools:', error);
      setPools([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get auth token
  const getAuthToken = async () => {
    return await authService.getToken();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPools();
    setRefreshing(false);
  };

  const handleLeavePool = async (poolId: string) => {
    Alert.alert(
      'Leave Pool',
      'Are you sure you want to leave this carpool?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://10.6.192.157:9898/api/carpool/leave/${poolId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${await getAuthToken()}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                Alert.alert('Success', 'You have left the carpool');
                loadPools();
              } else {
                Alert.alert('Error', 'Could not leave carpool');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error occurred');
            }
          },
        },
      ]
    );
  };

  const handleCompletePool = async (poolId: string) => {
    Alert.alert(
      'Complete Trip',
      'Mark this carpool as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const response = await fetch(`http://10.6.192.157:9898/api/carpool/complete/${poolId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${await getAuthToken()}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                Alert.alert('Success', 'Trip completed successfully!');
                loadPools();
              } else {
                Alert.alert('Error', 'Could not complete trip');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error occurred');
            }
          },
        },
      ]
    );
  };

  const handleViewMap = async (pool: Pool) => {
    setSelectedPool(pool);
    await loadMemberLocations(pool._id);
    setShowMapModal(true);
  };

  const closeMapModal = () => {
    setShowMapModal(false);
    setSelectedPool(null);
    setMemberLocations({});
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48 && diffInHours > 24) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#1193d4';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#92b7c9';
    }
  };

  const renderPoolCard = ({ item }: { item: Pool }) => (
    <View style={styles.poolCard}>
      <LinearGradient
        colors={['rgba(17, 147, 212, 0.1)', 'rgba(17, 147, 212, 0.05)']}
        style={styles.cardGradient}
      >
        {/* Status Header */}
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.costText}>${item.costPerUser}/person</Text>
        </View>

        {/* Pool Info */}
        <View style={styles.poolInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color="#1193d4" />
            <Text style={styles.infoText}>{formatDate(item.departureTime)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color="#1193d4" />
            <Text style={styles.infoText}>{item.members.length} member{item.members.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#1193d4" />
            <Text style={styles.infoText}>
              {item.pickupZone.lat.toFixed(4)}, {item.pickupZone.lng.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {item.status === 'active' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.mapButton]}
                onPress={() => handleViewMap(item)}
              >
                <Ionicons name="map" size={16} color="white" />
                <Text style={styles.actionButtonText}>View Map</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleCompletePool(item._id)}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.leaveButton]}
                onPress={() => handleLeavePool(item._id)}
              >
                <Ionicons name="exit" size={16} color="white" />
                <Text style={styles.actionButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="car-sport" size={64} color="#92b7c9" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'active' ? 'No Active Carpools' : 'No Pool History'}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'active' 
          ? 'Request a ride to get matched with carpools' 
          : 'Your completed trips will appear here'
        }
      </Text>
      {activeTab === 'active' && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/request-ride')}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Request Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111c22" />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <BlurView intensity={80} style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>My Carpools</Text>
            
            {/* Live Map Button */}
            <TouchableOpacity 
              style={styles.liveMapButton}
              onPress={() => router.push('/simple-carpool')}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.liveMapGradient}
              >
                <Ionicons name="map" size={18} color="white" />
                <Text style={styles.liveMapText}>Live Map</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'active' && styles.activeTab]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </SafeAreaView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading carpools...</Text>
        </View>
      ) : pools.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={pools}
          renderItem={renderPoolCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#1193d4"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={closeMapModal}
      >
        <View style={styles.mapContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#111c22" />
          
          {/* Map Header */}
          <SafeAreaView style={styles.mapHeader}>
            <BlurView intensity={80} style={styles.mapHeaderContent}>
              <TouchableOpacity onPress={closeMapModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.mapTitle}>
                {selectedPool ? `Carpool Members (${selectedPool.members.length})` : 'Carpool Map'}
              </Text>
              <View style={styles.placeholder} />
            </BlurView>
          </SafeAreaView>

          {/* Map View */}
          {selectedPool && (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: selectedPool.pickupZone.lat,
                longitude: selectedPool.pickupZone.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              customMapStyle={[
                {
                  elementType: 'geometry',
                  stylers: [{ color: '#1d2c4d' }],
                },
                {
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#8ec3b9' }],
                },
                {
                  elementType: 'labels.text.stroke',
                  stylers: [{ color: '#1a3646' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry',
                  stylers: [{ color: '#38414e' }],
                },
                {
                  featureType: 'road',
                  elementType: 'geometry.stroke',
                  stylers: [{ color: '#212a37' }],
                },
                {
                  featureType: 'road',
                  elementType: 'labels.text.fill',
                  stylers: [{ color: '#9ca5b3' }],
                },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#0e1626' }],
                },
              ]}
            >
              {/* Pickup Zone Marker */}
              <Marker
                coordinate={{
                  latitude: selectedPool.pickupZone.lat,
                  longitude: selectedPool.pickupZone.lng,
                }}
                title="Pickup Zone"
                description="Meeting point for carpool"
              >
                <View style={styles.pickupMarker}>
                  <Ionicons name="location" size={20} color="white" />
                </View>
              </Marker>

              {/* User's Current Location */}
              {userLocation && (
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="Your Location"
                  description="Your current position"
                >
                  <View style={styles.userMarker}>
                    <Ionicons name="person" size={16} color="white" />
                  </View>
                </Marker>
              )}

              {/* Other Members' Locations */}
              {Object.entries(memberLocations).map(([memberId, location]) => (
                <Marker
                  key={memberId}
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Carpool Member"
                  description="Member location"
                >
                  <View style={styles.memberMarker}>
                    <Ionicons name="person" size={14} color="white" />
                  </View>
                </Marker>
              ))}
            </MapView>
          )}

          {/* Map Info Panel */}
          <View style={styles.mapInfoPanel}>
            <BlurView intensity={80} style={styles.mapInfoContent}>
              <Text style={styles.mapInfoTitle}>Live Locations</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#1193d4' }]} />
                  <Text style={styles.legendText}>Pickup Zone</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
                  <Text style={styles.legendText}>You</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
                  <Text style={styles.legendText}>Members</Text>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
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
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(17, 28, 34, 0.9)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1193d4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92b7c9',
  },
  activeTabText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#92b7c9',
    fontFamily: 'Space Grotesk',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  poolCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92b7c9',
    letterSpacing: 0.5,
  },
  costText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1193d4',
    fontFamily: 'Space Grotesk',
  },
  poolInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 12,
    fontFamily: 'Space Grotesk',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    minWidth: 80,
  },
  mapButton: {
    backgroundColor: '#1193d4',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 50,
    padding: 30,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Space Grotesk',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#92b7c9',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Space Grotesk',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1193d4',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  // Map Styles
  mapContainer: {
    flex: 1,
    backgroundColor: '#111c22',
  },
  mapHeader: {
    backgroundColor: 'rgba(17, 28, 34, 0.95)',
    zIndex: 1,
  },
  mapHeaderContent: {
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
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  placeholder: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  pickupMarker: {
    backgroundColor: '#1193d4',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    backgroundColor: '#34C759',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  memberMarker: {
    backgroundColor: '#FF9500',
    borderRadius: 13,
    padding: 5,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapInfoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 28, 34, 0.95)',
  },
  mapInfoContent: {
    padding: 20,
    backgroundColor: 'rgba(17, 28, 34, 0.9)',
  },
  mapInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#92b7c9',
    fontFamily: 'Space Grotesk',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liveMapButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveMapGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  liveMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
});
