import DelhiNCRLocationPicker from '@/components/DelhiNCRLocationPicker';
import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { DelhiNCRLocation } from '@/services/delhiNCRLocationService';
import socketService, { LiveUser as SocketUser } from '@/services/socketService';
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

const { width, height } = Dimensions.get('window');

interface RouteUser extends SocketUser {
  id: string;
  name: string;
  photo: string;
  fromLocationName: string;
  toLocationName: string;
  userType: 'driver' | 'passenger' | 'looking';
  vehicle?: string;
  seatsAvailable?: number;
  pricePerSeat?: number;
  joinedAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'system';
}

const RouteBasedCarpoolScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  // Route selection state
  const [fromLocation, setFromLocation] = useState<DelhiNCRLocation | null>(null);
  const [toLocation, setToLocation] = useState<DelhiNCRLocation | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [userType, setUserType] = useState<'driver' | 'passenger' | 'looking'>('looking');
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoinedRoute, setHasJoinedRoute] = useState(false);
  
  // Matched users on same route
  const [routeUsers, setRouteUsers] = useState<RouteUser[]>([]);
  
  // Chat state
  const [selectedUser, setSelectedUser] = useState<RouteUser | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');

  // Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);
        console.log('✅ Connected to Socket.IO server');

        // Set up event listeners
        setupSocketListeners();

      } catch (error) {
        console.error('❌ Socket connection failed:', error);
        Alert.alert('Connection Error', 'Could not connect to server. Please try again.');
      }
    };

    initializeSocket();

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const setupSocketListeners = () => {
    // Listen for users on same route
    socketService.onActiveUsers((users) => {
      console.log('📍 Received route users:', users.length);
      const mappedUsers: RouteUser[] = users
        .filter(socketUser => socketUser.userId !== user?._id) // Exclude self
        .map(socketUser => ({
          ...socketUser,
          id: socketUser.socketId,
          name: socketUser.username,
          photo: `https://i.pravatar.cc/150?u=${socketUser.userId}`,
          fromLocationName: parseLocationFromDestination(socketUser.destination).from,
          toLocationName: parseLocationFromDestination(socketUser.destination).to,
          userType: socketUser.userType,
          vehicle: socketUser.userType === 'driver' ? 'Car' : undefined,
          seatsAvailable: socketUser.userType === 'driver' ? 3 : undefined,
          pricePerSeat: socketUser.userType === 'driver' ? 100 : undefined,
          joinedAt: socketUser.joinedAt || new Date().toISOString(),
        }));
      setRouteUsers(mappedUsers);
    });

    socketService.onUserJoined((socketUser) => {
      if (socketUser.userId === user?._id) return; // Skip self
      
      console.log('👋 New user joined route:', socketUser.username);
      const newUser: RouteUser = {
        ...socketUser,
        id: socketUser.socketId,
        name: socketUser.username,
        photo: `https://i.pravatar.cc/150?u=${socketUser.userId}`,
        fromLocationName: parseLocationFromDestination(socketUser.destination).from,
        toLocationName: parseLocationFromDestination(socketUser.destination).to,
        userType: socketUser.userType,
        vehicle: socketUser.userType === 'driver' ? 'Car' : undefined,
        seatsAvailable: socketUser.userType === 'driver' ? 3 : undefined,
        pricePerSeat: socketUser.userType === 'driver' ? 100 : undefined,
        joinedAt: socketUser.joinedAt || new Date().toISOString(),
      };
      
      setRouteUsers(prev => [...prev, newUser]);
      
      // Show matching notification
      Alert.alert(
        '🎉 Route Match!', 
        `Wow! ${socketUser.username} is also traveling the same route!`,
        [{ text: 'Cool!', style: 'default' }]
      );
    });

    socketService.onUserLeft((data) => {
      console.log('👋 User left route:', data.userId);
      setRouteUsers(prev => prev.filter(user => user.id !== data.socketId));
    });

    // Chat message received
    socketService.getSocket()?.on('chatMessage', (data) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        timestamp: data.timestamp,
        type: 'text',
      };
      setChatMessages(prev => [...prev, newMessage]);
    });
  };

  const parseLocationFromDestination = (destination: string) => {
    // Parse "From → To" format
    if (destination.includes(' → ')) {
      const [from, to] = destination.split(' → ');
      return { from: from.trim(), to: to.trim() };
    }
    return { from: 'Unknown', to: destination };
  };

  const handleJoinRoute = () => {
    if (!fromLocation || !toLocation || !isConnected) {
      Alert.alert('Error', 'Please select both locations and ensure connection.');
      return;
    }

    const routeString = `${fromLocation.name} → ${toLocation.name}`;
    
    // Join route on Socket.IO
    socketService.joinLiveMap({
      userId: user?._id || 'user_' + Date.now(),
      username: user?.username || 'User',
      userType: userType,
      location: fromLocation.coordinates, // Use selected location
      destination: routeString, // Route-based matching
    });

    setHasJoinedRoute(true);
    
    Alert.alert(
      '🚗 Joined Route!', 
      `You're now looking for carpools on ${routeString}`,
      [{ text: 'Great!', style: 'default' }]
    );
  };

  const handleStartChat = (targetUser: RouteUser) => {
    setSelectedUser(targetUser);
    setChatMessages([
      {
        id: '1',
        senderId: 'system',
        senderName: 'System',
        message: `Chat started with ${targetUser.name}. You're both traveling ${targetUser.fromLocationName} → ${targetUser.toLocationName}`,
        timestamp: new Date().toISOString(),
        type: 'system',
      }
    ]);
    setShowChatModal(true);
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;

    const message = {
      senderId: user?._id || 'unknown',
      senderName: user?.username || 'User',
      targetUserId: selectedUser.userId,
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Send via Socket.IO
    socketService.getSocket()?.emit('sendChatMessage', message);

    // Add to local chat
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: message.senderId,
      senderName: message.senderName,
      message: message.message,
      timestamp: message.timestamp,
      type: 'text',
    };
    setChatMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Carpool</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isConnected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!hasJoinedRoute ? (
          /* Route Selection */
          <View style={styles.routeSelection}>
            <Text style={styles.sectionTitle}>Select Your Route</Text>
            <Text style={styles.sectionSubtitle}>Find carpools on the same route as you</Text>

            {/* From Location */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setShowFromPicker(true)}
            >
              <BlurView intensity={20} style={styles.locationBlur}>
                <Ionicons name="location" size={20} color={FlowColors.primary} />
                <Text style={styles.locationText}>
                  {fromLocation ? fromLocation.name : 'Select pickup location'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
              </BlurView>
            </TouchableOpacity>

            {/* To Location */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setShowToPicker(true)}
            >
              <BlurView intensity={20} style={styles.locationBlur}>
                <Ionicons name="flag" size={20} color={FlowColors.primary} />
                <Text style={styles.locationText}>
                  {toLocation ? toLocation.name : 'Select destination'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.6)" />
              </BlurView>
            </TouchableOpacity>

            {/* User Type Selection */}
            <View style={styles.userTypeSection}>
              <Text style={styles.userTypeTitle}>I am a:</Text>
              <View style={styles.userTypeButtons}>
                {(['driver', 'passenger', 'looking'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.userTypeButton,
                      userType === type && styles.userTypeButtonActive
                    ]}
                    onPress={() => setUserType(type)}
                  >
                    <Text style={[
                      styles.userTypeButtonText,
                      userType === type && styles.userTypeButtonTextActive
                    ]}>
                      {type === 'looking' ? 'Looking for ride' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Join Route Button */}
            <TouchableOpacity
              style={styles.joinRouteButton}
              onPress={handleJoinRoute}
              disabled={!fromLocation || !toLocation || !isConnected}
            >
              <LinearGradient
                colors={['#1193d4', '#0c7db8']}
                style={styles.joinRouteGradient}
              >
                <Ionicons name="map" size={20} color="white" />
                <Text style={styles.joinRouteText}>Find Carpools on This Route</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* Route Users */
          <View style={styles.routeUsers}>
            <View style={styles.currentRouteHeader}>
              <Text style={styles.currentRouteTitle}>
                {fromLocation?.name} → {toLocation?.name}
              </Text>
              <Text style={styles.currentRouteSubtitle}>
                {routeUsers.length} other{routeUsers.length !== 1 ? 's' : ''} on this route
              </Text>
            </View>

            {routeUsers.length === 0 ? (
              <View style={styles.noUsersCard}>
                <Ionicons name="car-outline" size={48} color="#666" />
                <Text style={styles.noUsersText}>No one else on this route yet</Text>
                <Text style={styles.noUsersSubtext}>You'll be notified when someone joins!</Text>
              </View>
            ) : (
              routeUsers.map((routeUser) => (
                <View key={routeUser.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>{routeUser.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{routeUser.name}</Text>
                      <Text style={styles.userRoute}>
                        {routeUser.fromLocationName} → {routeUser.toLocationName}
                      </Text>
                      <View style={styles.userMeta}>
                        <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(routeUser.userType) }]}>
                          <Text style={styles.userTypeText}>{routeUser.userType}</Text>
                        </View>
                        <Text style={styles.joinedTime}>
                          Joined {getTimeAgo(routeUser.joinedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => handleStartChat(routeUser)}
                  >
                    <Ionicons name="chatbubble" size={20} color={FlowColors.primary} />
                    <Text style={styles.chatButtonText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Location Pickers */}
      <Modal visible={showFromPicker} animationType="slide" presentationStyle="pageSheet">
        <DelhiNCRLocationPicker
          visible={showFromPicker}
          onLocationSelect={(location) => {
            setFromLocation(location);
            setShowFromPicker(false);
          }}
          onClose={() => setShowFromPicker(false)}
          title="Select Pickup Location"
          placeholder="Search pickup location..."
        />
      </Modal>

      <Modal visible={showToPicker} animationType="slide" presentationStyle="pageSheet">
        <DelhiNCRLocationPicker
          visible={showToPicker}
          onLocationSelect={(location) => {
            setToLocation(location);
            setShowToPicker(false);
          }}
          onClose={() => setShowToPicker(false)}
          title="Select Destination"
          placeholder="Search destination..."
        />
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChatModal(false)}
      >
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChatModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.chatTitle}>
              Chat with {selectedUser?.name}
            </Text>
            <View />
          </View>

          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.type === 'system' ? styles.systemMessage : 
                  message.senderId === user?._id ? styles.myMessage : styles.theirMessage
                ]}
              >
                {message.type !== 'system' && message.senderId !== user?._id && (
                  <Text style={styles.messageSender}>{message.senderName}</Text>
                )}
                <Text style={[
                  styles.messageText,
                  message.type === 'system' && styles.systemMessageText
                ]}>
                  {message.message}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInput}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={messageText.trim() ? FlowColors.primary : '#ccc'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getUserTypeColor = (type: string) => {
  switch (type) {
    case 'driver': return '#10b981';
    case 'passenger': return '#3b82f6';
    case 'looking': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
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
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  routeSelection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  locationButton: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  userTypeSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userTypeButtonActive: {
    backgroundColor: FlowColors.primary,
    borderColor: FlowColors.primary,
  },
  userTypeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: 'white',
  },
  joinRouteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinRouteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  joinRouteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  routeUsers: {
    padding: 20,
  },
  currentRouteHeader: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentRouteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  currentRouteSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  noUsersCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noUsersText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  noUsersSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: FlowColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  userTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  joinedTime: {
    fontSize: 12,
    color: '#999',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
  },
  chatButtonText: {
    color: FlowColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: FlowColors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 20,
  },
  systemMessageText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
  },
});

export default RouteBasedCarpoolScreen;