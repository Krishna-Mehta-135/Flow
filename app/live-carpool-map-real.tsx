import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import socketService, { LiveUser as SocketUser } from '@/services/socketService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface LiveUser extends SocketUser {
  id: string;
  name: string;
  photo: string;
  estimatedArrival: string;
  distance: number; // km from user
  pricePerSeat?: number;
  lastSeen: string;
  rideRequestId?: string;
  poolId?: string;
  seatsAvailable?: number;
  vehicle?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
  type: 'text' | 'location' | 'ride_request';
}

const LiveCarpoolMapScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  // User location state
  const [userLocation, setUserLocation] = useState({
    latitude: 28.6139, // Default to Delhi
    longitude: 77.2090,
  });
  
  // Live users from Socket.IO
  const [nearbyUsers, setNearbyUsers] = useState<LiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Selected user for chat/profile
  const [selectedUser, setSelectedUser] = useState<LiveUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');

  // Socket.IO connection and real-time users
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initializeSocket = async () => {
      try {
        // Connect to Socket.IO server
        await socketService.connect();
        setIsConnected(true);

        // Get user's current location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync();
          const currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(currentLocation);

          // Join live map with user data
          socketService.joinLiveMap({
            userId: user._id || 'user_' + Date.now(),
            username: user.username || 'User',
            userType: 'looking', // Can be changed based on user selection
            location: currentLocation,
            destination: 'Delhi Metro Station', // Default destination
          });
        }

        // Set up Socket.IO event listeners
        socketService.onActiveUsers((users) => {
          console.log('📍 Received active users:', users.length);
          const mappedUsers: LiveUser[] = users.map(socketUser => ({
            ...socketUser,
            id: socketUser.socketId,
            name: socketUser.username,
            photo: `https://i.pravatar.cc/150?u=${socketUser.userId}`,
            estimatedArrival: '5-15 mins',
            distance: calculateDistance(userLocation, socketUser.location),
            pricePerSeat: socketUser.userType === 'driver' ? 100 : undefined,
            lastSeen: 'Now',
            seatsAvailable: socketUser.userType === 'driver' ? 3 : undefined,
            vehicle: socketUser.userType === 'driver' ? 'Car' : undefined,
          }));
          setNearbyUsers(mappedUsers);
        });

        socketService.onUserJoined((user) => {
          console.log('👋 User joined:', user.username);
          const newUser: LiveUser = {
            ...user,
            id: user.socketId,
            name: user.username,
            photo: `https://i.pravatar.cc/150?u=${user.userId}`,
            estimatedArrival: '5-15 mins',
            distance: calculateDistance(userLocation, user.location),
            pricePerSeat: user.userType === 'driver' ? 100 : undefined,
            lastSeen: 'Now',
            seatsAvailable: user.userType === 'driver' ? 3 : undefined,
            vehicle: user.userType === 'driver' ? 'Car' : undefined,
          };
          setNearbyUsers(prev => [...prev, newUser]);
        });

        socketService.onUserLeft((data) => {
          console.log('👋 User left:', data.userId);
          setNearbyUsers(prev => prev.filter(user => user.id !== data.socketId));
        });

        socketService.onUserLocationUpdate((data) => {
          console.log('📍 Location update for:', data.userId);
          setNearbyUsers(prev => prev.map(user => 
            user.id === data.socketId 
              ? { 
                  ...user, 
                  location: data.location,
                  distance: calculateDistance(userLocation, data.location),
                  lastSeen: 'Now'
                }
              : user
          ));
        });

        socketService.onRideRequestReceived((data) => {
          Alert.alert(
            '🚗 Ride Request',
            `${data.from.username} wants to join your carpool!`,
            [
              {
                text: 'Decline',
                style: 'cancel',
                onPress: () => socketService.respondToRideRequest(data.from.socketId, false, 'Sorry, not available')
              },
              {
                text: 'Accept',
                onPress: () => socketService.respondToRideRequest(data.from.socketId, true, 'Great! Let\'s coordinate pickup')
              }
            ]
          );
        });

        socketService.onRideRequestResponse((data) => {
          if (data.accepted) {
            Alert.alert('✅ Request Accepted', `${data.from.username} accepted your ride request!`);
          } else {
            Alert.alert('❌ Request Declined', `${data.from.username} declined your request.`);
          }
        });

        socketService.onUserStatusUpdate((data) => {
          setNearbyUsers(prev => prev.map(user => {
            const statusUpdate = data.users.find(u => u.socketId === user.id);
            return statusUpdate ? { ...user, status: statusUpdate.status as 'looking' | 'matched' } : user;
          }));
        });

      } catch (error) {
        console.error('❌ Socket connection failed:', error);
        Alert.alert('Connection Error', 'Could not connect to live map. Please try again.');
      }
    };

    initializeSocket();

    // Update location every 30 seconds
    const locationInterval = setInterval(async () => {
      if (isConnected) {
        try {
          const location = await Location.getCurrentPositionAsync();
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(newLocation);
          socketService.updateLocation(newLocation);
        } catch (error) {
          console.log('Location update failed:', error);
        }
      }
    }, 30000);

    return () => {
      clearInterval(locationInterval);
      socketService.removeAllListeners();
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  // Calculate distance between two points
  const calculateDistance = (point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }) => {
    const lat1 = point1.latitude;
    const lon1 = point1.longitude;
    const lat2 = point2.latitude;
    const lon2 = point2.longitude;
    
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10; // Round to 1 decimal
  };
  
  const handleJoinCarpool = async (targetUser: LiveUser) => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server. Please try again.');
      return;
    }

    Alert.alert(
      'Join Carpool',
      `Send ride request to ${targetUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          onPress: () => {
            socketService.sendRideRequest(targetUser.userId, `Hi! I'd like to join your carpool to ${targetUser.destination}`);
            Alert.alert('Request Sent', `Ride request sent to ${targetUser.name}`);
          }
        }
      ]
    );
  };

  const handleUserMarkerPress = (user: LiveUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
    
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: height * 0.4, // Show from 60% of screen height
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeUserModal = () => {
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowUserModal(false);
      setSelectedUser(null);
    });
  };

  const getMarkerColor = (userType: 'driver' | 'passenger' | 'looking') => {
    switch (userType) {
      case 'driver': return '#10b981';
      case 'passenger': return '#3b82f6';
      case 'looking': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getMarkerIcon = (userType: 'driver' | 'passenger' | 'looking') => {
    switch (userType) {
      case 'driver': return 'car';
      case 'passenger': return 'person';
      case 'looking': return 'search';
      default: return 'location';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Carpool Map</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isConnected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User Markers */}
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={user.location}
            onPress={() => handleUserMarkerPress(user)}
          >
            <View style={[styles.userMarker, { backgroundColor: getMarkerColor(user.userType) }]}>
              <Ionicons 
                name={getMarkerIcon(user.userType) as any} 
                size={16} 
                color="white" 
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={FlowColors.primary} />
          <Text style={styles.statText}>{nearbyUsers.length} users nearby</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="car" size={16} color="#10b981" />
          <Text style={styles.statText}>{nearbyUsers.filter(u => u.userType === 'driver').length} drivers</Text>
        </View>
      </View>

      {/* User Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeUserModal}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeUserModal}>
          <Animated.View 
            style={[
              styles.userModal,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>{selectedUser.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{selectedUser.name}</Text>
                      <Text style={styles.userRating}>⭐ {selectedUser.rating}</Text>
                    </View>
                  </View>
                  <View style={[styles.userTypeBadge, { backgroundColor: getMarkerColor(selectedUser.userType) }]}>
                    <Text style={styles.userTypeText}>{selectedUser.userType}</Text>
                  </View>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.destinationRow}>
                    <Ionicons name="location" size={20} color={FlowColors.primary} />
                    <Text style={styles.destinationText}>{selectedUser.destination}</Text>
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Distance</Text>
                      <Text style={styles.detailValue}>{selectedUser.distance}km</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>ETA</Text>
                      <Text style={styles.detailValue}>{selectedUser.estimatedArrival}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailValue}>{selectedUser.status}</Text>
                    </View>
                  </View>

                  {selectedUser.userType === 'driver' && (
                    <View style={styles.driverDetails}>
                      <Text style={styles.vehicleText}>🚗 {selectedUser.vehicle}</Text>
                      <Text style={styles.seatsText}>{selectedUser.seatsAvailable} seats • ₹{selectedUser.pricePerSeat}/seat</Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.joinButton}
                    onPress={() => handleJoinCarpool(selectedUser)}
                  >
                    <LinearGradient
                      colors={[FlowColors.primary, '#0c7db8']}
                      style={styles.joinButtonGradient}
                    >
                      <Ionicons name="add-circle" size={20} color="white" />
                      <Text style={styles.joinButtonText}>Send Ride Request</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: FlowColors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  userModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: height * 0.4,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: FlowColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  userTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalContent: {
    padding: 20,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    color: '#333',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  driverDetails: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  seatsText: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LiveCarpoolMapScreen;