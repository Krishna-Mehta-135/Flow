import { FlowColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface LiveUser {
  id: string;
  name: string;
  photo: string;
  rating: number;
  location: {
    latitude: number;
    longitude: number;
  };
  destination: string;
  userType: 'driver' | 'passenger' | 'looking';
  vehicle?: string;
  seatsAvailable?: number;
  estimatedArrival: string;
  distance: number; // km from user
  pricePerSeat?: number;
  lastSeen: string;
  rideRequestId?: string;
  poolId?: string;
  status: 'waiting' | 'matched' | 'in_pool';
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
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  // User location state
  const [userLocation, setUserLocation] = useState({
    latitude: 28.6139, // Default to Delhi
    longitude: 77.2090,
  });
  
  // Live users nearby
  const [nearbyUsers, setNearbyUsers] = useState<LiveUser[]>([]);
  
  // Selected user for chat/profile
  const [selectedUser, setSelectedUser] = useState<LiveUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');

  // Mock data and live updates
  useEffect(() => {
    // Initial mock users - 8 users with different statuses
    const initialUsers: LiveUser[] = [
      {
        id: '1',
        name: 'Rajesh Kumar',
        photo: 'https://i.pravatar.cc/150?img=1',
        rating: 4.8,
        location: { latitude: 28.6149, longitude: 77.2080 },
        destination: 'Gurgaon Cyber City',
        userType: 'driver',
        vehicle: 'Honda City',
        seatsAvailable: 3,
        estimatedArrival: '15 mins',
        distance: 0.5,
        pricePerSeat: 120,
        lastSeen: '2 mins ago',
        rideRequestId: 'req_1',
        status: 'waiting',
      },
      {
        id: '2',
        name: 'Priya Sharma',
        photo: 'https://i.pravatar.cc/150?img=2',
        rating: 4.9,
        location: { latitude: 28.6129, longitude: 77.2100 },
        destination: 'Noida Sector 62',
        userType: 'passenger',
        estimatedArrival: '8 mins',
        distance: 0.3,
        lastSeen: '1 min ago',
        rideRequestId: 'req_2',
        status: 'waiting',
      },
      {
        id: '3',
        name: 'Vikram Singh',
        photo: 'https://i.pravatar.cc/150?img=3',
        rating: 4.7,
        location: { latitude: 28.6159, longitude: 77.2070 },
        destination: 'Airport Terminal 3',
        userType: 'driver',
        vehicle: 'Hyundai Creta',
        seatsAvailable: 2,
        estimatedArrival: '12 mins',
        distance: 0.8,
        pricePerSeat: 200,
        lastSeen: '3 mins ago',
        rideRequestId: 'req_3',
        status: 'waiting',
      },
      {
        id: '4',
        name: 'Sneha Gupta',
        photo: 'https://i.pravatar.cc/150?img=4',
        rating: 4.6,
        location: { latitude: 28.6119, longitude: 77.2110 },
        destination: 'Connaught Place',
        userType: 'passenger',
        estimatedArrival: '5 mins',
        distance: 0.2,
        lastSeen: 'Just now',
        rideRequestId: 'req_4',
        status: 'waiting',
      },
      {
        id: '5',
        name: 'Amit Verma',
        photo: 'https://i.pravatar.cc/150?img=5',
        rating: 4.5,
        location: { latitude: 28.6140, longitude: 77.2085 },
        destination: 'Gurgaon Cyber City',
        userType: 'looking',
        estimatedArrival: '10 mins',
        distance: 0.1,
        lastSeen: 'Just now',
        rideRequestId: 'req_5',
        status: 'waiting',
      },
      {
        id: '6',
        name: 'Neha Aggarwal',
        photo: 'https://i.pravatar.cc/150?img=6',
        rating: 4.8,
        location: { latitude: 28.6135, longitude: 77.2095 },
        destination: 'Gurgaon Cyber City',
        userType: 'passenger',
        estimatedArrival: '7 mins',
        distance: 0.4,
        lastSeen: '30 secs ago',
        rideRequestId: 'req_6',
        status: 'waiting',
      },
      {
        id: '7',
        name: 'Rohan Malhotra',
        photo: 'https://i.pravatar.cc/150?img=7',
        rating: 4.9,
        location: { latitude: 28.6155, longitude: 77.2075 },
        destination: 'Noida Sector 18',
        userType: 'driver',
        vehicle: 'Maruti Swift',
        seatsAvailable: 3,
        estimatedArrival: '18 mins',
        distance: 0.6,
        pricePerSeat: 80,
        lastSeen: '1 min ago',
        rideRequestId: 'req_7',
        status: 'waiting',
      },
      {
        id: '8',
        name: 'Kavya Reddy',
        photo: 'https://i.pravatar.cc/150?img=8',
        rating: 4.7,
        location: { latitude: 28.6125, longitude: 77.2105 },
        destination: 'Airport Terminal 3',
        userType: 'looking',
        estimatedArrival: '6 mins',
        distance: 0.35,
        lastSeen: 'Just now',
        rideRequestId: 'req_8',
        status: 'waiting',
      },
    ];
    
    setNearbyUsers(initialUsers);

    // Live updates every 10 seconds - simulate real-time activity
    const liveUpdateInterval = setInterval(() => {
      setNearbyUsers(prev => {
        const updated = [...prev];
        
        // Randomly update some users' locations (simulate movement)
        const movingUsers = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < movingUsers; i++) {
          const randomIndex = Math.floor(Math.random() * updated.length);
          const user = updated[randomIndex];
          
          // Small location changes (realistic movement ~100m)
          const latChange = (Math.random() - 0.5) * 0.001;
          const lngChange = (Math.random() - 0.5) * 0.001;
          
          updated[randomIndex] = {
            ...user,
            location: {
              latitude: user.location.latitude + latChange,
              longitude: user.location.longitude + lngChange,
            },
            lastSeen: 'Just now',
          };
        }
        
        // Simulate new users joining occasionally (max 12 users)
        if (Math.random() < 0.2 && updated.length < 12) {
          const newUser: LiveUser = {
            id: `user_${Date.now()}`,
            name: `New User ${updated.length + 1}`,
            photo: `https://i.pravatar.cc/150?img=${updated.length + 10}`,
            rating: 4.2 + Math.random() * 0.7,
            location: {
              latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
              longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
            },
            destination: ['Gurgaon Cyber City', 'Noida Sector 62', 'Airport Terminal 3'][Math.floor(Math.random() * 3)],
            userType: ['driver', 'passenger', 'looking'][Math.floor(Math.random() * 3)] as any,
            estimatedArrival: `${Math.floor(Math.random() * 20) + 5} mins`,
            distance: Math.random() * 1.5,
            lastSeen: 'Just joined',
            rideRequestId: `req_${Date.now()}`,
            status: 'waiting',
          };
          
          if (newUser.userType === 'driver') {
            newUser.vehicle = ['Honda City', 'Maruti Swift', 'Hyundai Creta'][Math.floor(Math.random() * 3)];
            newUser.seatsAvailable = Math.floor(Math.random() * 3) + 1;
            newUser.pricePerSeat = Math.floor(Math.random() * 100) + 80;
          }
          
          updated.push(newUser);
        }
        
        return updated;
      });
    }, 12000);

    // Distance-based matching simulation (uses your backend logic)
    const matchingInterval = setInterval(() => {
      setNearbyUsers(prev => {
        const updated = [...prev];
        const waitingUsers = updated.filter(user => user.status === 'waiting');
        const matched: string[] = [];
        
        // Find matches within 2km radius (matching your backend)
        for (let i = 0; i < waitingUsers.length; i++) {
          for (let j = i + 1; j < waitingUsers.length; j++) {
            const user1 = waitingUsers[i];
            const user2 = waitingUsers[j];
            
            // Calculate distance (simplified)
            const distance = Math.sqrt(
              Math.pow(user1.location.latitude - user2.location.latitude, 2) +
              Math.pow(user1.location.longitude - user2.location.longitude, 2)
            ) * 111; // Rough km conversion
            
            // Match if within 2km and same destination (your backend logic)
            if (distance < 2 && user1.destination === user2.destination && Math.random() < 0.15) {
              matched.push(user1.id, user2.id);
            }
          }
        }
        
        // Update matched users
        return updated.map(user => 
          matched.includes(user.id) ? { ...user, status: 'matched' } : user
        );
      });
    }, 20000);

    return () => {
      clearInterval(liveUpdateInterval);
      clearInterval(matchingInterval);
    };
  }, []);

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

  const startChat = () => {
    if (!selectedUser) return;
    
    // Initialize chat with welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      senderId: selectedUser.id,
      message: `Hi! I'm ${selectedUser.name}. ${selectedUser.userType === 'driver' ? `I have ${selectedUser.seatsAvailable} seats available to ${selectedUser.destination}` : `Looking for a ride to ${selectedUser.destination}`}`,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    
    setChatMessages([welcomeMessage]);
    setShowChat(true);
    closeUserModal();
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'current_user',
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setMessageText('');
    
    // Simulate response after 2 seconds
    setTimeout(() => {
      const responses = [
        "Sounds good! When would you like to start?",
        "Perfect! I'll be there in 5 minutes.",
        "Great! Let me know when you're ready.",
        "Sure! What's your pickup location?",
      ];
      
      const responseMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: selectedUser.id,
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
        type: 'text',
      };
      
      setChatMessages(prev => [...prev, responseMessage]);
    }, 2000);
  };

  const sendRideRequest = async () => {
    if (!selectedUser) return;
    
    Alert.alert(
      'Join Carpool',
      `Join ${selectedUser.name}'s carpool to ${selectedUser.destination}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              // Simulate API call to join carpool
              const response = await fetch('http://10.6.192.157:9898/api/carpool/join', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  // Add auth token here
                },
                body: JSON.stringify({
                  rideRequestId: selectedUser.rideRequestId,
                  pickupLocation: userLocation,
                  destination: selectedUser.destination,
                }),
              });

              if (response.ok) {
                // Update user status to matched
                setNearbyUsers(prev => 
                  prev.map(user => 
                    user.id === selectedUser.id 
                      ? { ...user, status: 'matched' }
                      : user
                  )
                );

                const requestMessage: ChatMessage = {
                  id: Date.now().toString(),
                  senderId: 'current_user',
                  message: '🚗 Joined your carpool! Let\'s coordinate pickup.',
                  timestamp: new Date().toISOString(),
                  type: 'ride_request',
                };
                
                setChatMessages(prev => [...prev, requestMessage]);
                Alert.alert('Success', 'Successfully joined the carpool!');
                
                // Start live location sharing
                startLocationSharing();
              } else {
                Alert.alert('Error', 'Could not join carpool. Please try again.');
              }
            } catch (error) {
              console.error('Error joining carpool:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          },
        },
      ]
    );
  };

  const startLocationSharing = () => {
    // Simulate live location updates
    Alert.alert(
      'Location Sharing',
      'Your live location will be shared with carpool members for coordination.',
      [{ text: 'OK' }]
    );
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
      default: return 'help';
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User markers */}
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={user.location}
            onPress={() => handleUserMarkerPress(user)}
          >
            <View style={[styles.markerContainer, { borderColor: getMarkerColor(user.userType) }]}>
              <View style={[styles.markerInner, { backgroundColor: getMarkerColor(user.userType) }]}>
                <Ionicons 
                  name={getMarkerIcon(user.userType) as any} 
                  size={16} 
                  color="white" 
                />
              </View>
              {user.userType === 'driver' && user.seatsAvailable && (
                <View style={styles.seatsBadge}>
                  <Text style={styles.seatsText}>{user.seatsAvailable}</Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BlurView intensity={20} style={styles.headerButtonBlur}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </BlurView>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <BlurView intensity={20} style={styles.headerInfoBlur}>
            <Text style={styles.headerTitle}>Live Carpool</Text>
            <Text style={styles.headerSubtitle}>{nearbyUsers.length} users nearby</Text>
          </BlurView>
        </View>
      </View>

      {/* Bottom user list */}
      <View style={styles.bottomPanel}>
        <BlurView intensity={20} style={styles.bottomPanelBlur}>
          <Text style={styles.bottomPanelTitle}>👥 Nearby Users</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersList}>
            {nearbyUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => handleUserMarkerPress(user)}
              >
                <View style={[styles.userTypeIndicator, { backgroundColor: getMarkerColor(user.userType) }]}>
                  <Ionicons 
                    name={getMarkerIcon(user.userType) as any} 
                    size={12} 
                    color="white" 
                  />
                </View>
                <Text style={styles.userName}>{user.name.split(' ')[0]}</Text>
                <Text style={styles.userDistance}>{user.distance.toFixed(1)}km</Text>
                <Text style={styles.userTime}>{user.estimatedArrival}</Text>
                {user.status === 'matched' && (
                  <Text style={styles.matchedBadge}>✓ Matched</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      </View>

      {/* User Profile Modal */}
      {showUserModal && selectedUser && (
        <Animated.View
          style={[
            styles.userModal,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <BlurView intensity={20} style={styles.userModalBlur}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeUserModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>User Profile</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.userProfileRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitials}>
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userNameLarge}>{selectedUser.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{selectedUser.rating}</Text>
                    <Text style={styles.lastSeenText}>• {selectedUser.lastSeen}</Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: getMarkerColor(selectedUser.userType) }]}>
                  <Text style={styles.typeBadgeText}>
                    {selectedUser.userType === 'driver' ? '🚗 Driver' : 
                     selectedUser.userType === 'passenger' ? '👤 Passenger' : 
                     '🔍 Looking for ride'}
                  </Text>
                </View>
              </View>

              {/* Trip Details */}
              <View style={styles.tripDetails}>
                <View style={styles.tripRow}>
                  <Ionicons name="location" size={16} color="#ff4757" />
                  <Text style={styles.tripText}>Going to {selectedUser.destination}</Text>
                </View>
                <View style={styles.tripRow}>
                  <Ionicons name="time" size={16} color="#10b981" />
                  <Text style={styles.tripText}>Arrives in {selectedUser.estimatedArrival}</Text>
                </View>
                <View style={styles.tripRow}>
                  <Ionicons name="walk" size={16} color="#1193d4" />
                  <Text style={styles.tripText}>{selectedUser.distance.toFixed(1)}km away</Text>
                </View>
                {selectedUser.userType === 'driver' && (
                  <>
                    <View style={styles.tripRow}>
                      <Ionicons name="car" size={16} color="#f59e0b" />
                      <Text style={styles.tripText}>{selectedUser.vehicle}</Text>
                    </View>
                    <View style={styles.tripRow}>
                      <Ionicons name="people" size={16} color="#8b5cf6" />
                      <Text style={styles.tripText}>{selectedUser.seatsAvailable} seats available</Text>
                    </View>
                    <View style={styles.tripRow}>
                      <Ionicons name="cash" size={16} color="#10b981" />
                      <Text style={styles.tripText}>₹{selectedUser.pricePerSeat} per seat</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.chatButton} onPress={startChat}>
                  <LinearGradient colors={['#1193d4', '#0c7db8']} style={styles.buttonGradient}>
                    <Ionicons name="chatbubble" size={20} color="white" />
                    <Text style={styles.buttonText}>Chat</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.requestButton} onPress={sendRideRequest}>
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.buttonGradient}>
                    <Ionicons name="car-sport" size={20} color="white" />
                    <Text style={styles.buttonText}>Join Carpool</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Chat Modal */}
      <Modal visible={showChat} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.chatContainer}>
          <LinearGradient colors={[FlowColors.backgroundDark, '#1a1f2e', FlowColors.backgroundDark]} style={styles.chatGradient}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setShowChat(false)} style={styles.chatCloseButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.chatUserInfo}>
                <Text style={styles.chatUserName}>{selectedUser?.name}</Text>
                <Text style={styles.chatUserStatus}>Online • {selectedUser?.distance.toFixed(1)}km away</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            {/* Messages */}
            <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
              {chatMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.senderId === 'current_user' ? styles.sentMessage : styles.receivedMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.senderId === 'current_user' ? styles.sentBubble : styles.receivedBubble,
                    ]}
                  >
                    <Text style={styles.messageText}>{message.message}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.messageInput}>
              <BlurView intensity={20} style={styles.messageInputBlur}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                  <LinearGradient colors={['#1193d4', '#0c7db8']} style={styles.sendButtonGradient}>
                    <Ionicons name="send" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatsBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Space Grotesk',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FlowColors.glassEffect,
  },
  headerInfo: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  headerInfoBlur: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: FlowColors.glassEffect,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Space Grotesk',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bottomPanelBlur: {
    padding: 20,
    backgroundColor: FlowColors.glassEffect,
  },
  bottomPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 16,
  },
  usersList: {
    maxHeight: 120,
  },
  userCard: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    backgroundColor: FlowColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FlowColors.cardBorder,
    minWidth: 80,
  },
  userTypeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 4,
  },
  userDistance: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Space Grotesk',
    marginBottom: 2,
  },
  userTime: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
    fontFamily: 'Space Grotesk',
  },
  matchedBadge: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
    fontFamily: 'Space Grotesk',
    marginTop: 4,
  },
  userModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  userModalBlur: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark + 'F0', // 94% opacity
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: FlowColors.cardBorder,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginLeft: -28,
  },
  headerSpacer: {
    width: 28,
  },
  userInfo: {
    padding: 20,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FlowColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  userDetails: {
    flex: 1,
  },
  userNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginLeft: 4,
  },
  lastSeenText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Space Grotesk',
    marginLeft: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  tripDetails: {
    gap: 12,
    marginBottom: 24,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Space Grotesk',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  requestButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  chatContainer: {
    flex: 1,
  },
  chatGradient: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: FlowColors.cardBorder,
    backgroundColor: FlowColors.backgroundDark,
  },
  chatCloseButton: {
    padding: 4,
  },
  chatUserInfo: {
    flex: 1,
    marginLeft: 16,
  },
  chatUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Space Grotesk',
  },
  chatUserStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Space Grotesk',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    marginBottom: 16,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: FlowColors.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Space Grotesk',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Space Grotesk',
    textAlign: 'right',
  },
  messageInput: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: FlowColors.cardBorder,
  },
  messageInputBlur: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: FlowColors.cardBackground,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: FlowColors.cardBorder,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Space Grotesk',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveCarpoolMapScreen;