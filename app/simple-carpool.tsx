import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import socketService, { LiveUser as SocketUser } from '@/services/socketService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

const { width, height } = Dimensions.get('window');

// Simple predefined routes - no complex location picker
const POPULAR_ROUTES = [
  { id: '1', from: 'Connaught Place', to: 'Gurgaon Cyber City' },
  { id: '2', from: 'Karol Bagh', to: 'Noida Sector 62' },
  { id: '3', from: 'Delhi University', to: 'Airport' },
  { id: '4', from: 'Lajpat Nagar', to: 'Gurgaon' },
  { id: '5', from: 'Chandni Chowk', to: 'Dwarka' },
  { id: '6', from: 'India Gate', to: 'Faridabad' },
];

interface RouteUser extends SocketUser {
  id: string;
  name: string;
  fromLocationName: string;
  toLocationName: string;
  userType: 'driver' | 'passenger' | 'looking';
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

const SimpleCarpoolScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Simple route selection
  const [selectedRoute, setSelectedRoute] = useState<typeof POPULAR_ROUTES[0] | null>(null);
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
          fromLocationName: parseLocationFromDestination(socketUser.destination).from,
          toLocationName: parseLocationFromDestination(socketUser.destination).to,
          userType: socketUser.userType,
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
        fromLocationName: parseLocationFromDestination(socketUser.destination).from,
        toLocationName: parseLocationFromDestination(socketUser.destination).to,
        userType: socketUser.userType,
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
    if (destination.includes(' → ')) {
      const [from, to] = destination.split(' → ');
      return { from: from.trim(), to: to.trim() };
    }
    return { from: 'Unknown', to: destination };
  };

  const handleJoinRoute = () => {
    if (!selectedRoute || !isConnected) {
      Alert.alert('Error', 'Please select a route and ensure connection.');
      return;
    }

    const routeString = `${selectedRoute.from} → ${selectedRoute.to}`;
    
    // Join route on Socket.IO
    socketService.joinLiveMap({
      userId: user?._id || 'user_' + Date.now(),
      username: user?.username || 'User',
      userType: userType,
      location: { latitude: 28.6139, longitude: 77.2090 }, // Default location
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
      <StatusBar barStyle="light-content" backgroundColor="#111c22" />
      
      {/* Header - Matching App Style */}
      <SafeAreaView style={styles.header}>
        <BlurView intensity={80} style={styles.headerContent}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Live Route Match</Text>
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.statusText}>{isConnected ? 'Live' : 'Offline'}</Text>
            </View>
          </View>
        </BlurView>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!hasJoinedRoute ? (
          /* Route Selection */
          <View style={styles.routeSelection}>
            <Text style={styles.sectionTitle}>Select Your Route</Text>
            <Text style={styles.sectionSubtitle}>Choose from popular Delhi NCR routes</Text>

            {/* Popular Routes */}
            {POPULAR_ROUTES.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  selectedRoute?.id === route.id && styles.routeCardSelected
                ]}
                onPress={() => setSelectedRoute(route)}
              >
                <View style={styles.routeInfo}>
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={selectedRoute?.id === route.id ? FlowColors.primary : '#666'} 
                  />
                  <Text style={[
                    styles.routeText,
                    selectedRoute?.id === route.id && styles.routeTextSelected
                  ]}>
                    {route.from} → {route.to}
                  </Text>
                </View>
                {selectedRoute?.id === route.id && (
                  <Ionicons name="checkmark-circle" size={24} color={FlowColors.primary} />
                )}
              </TouchableOpacity>
            ))}

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
                      {type === 'looking' ? 'Looking' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Join Route Button */}
            <TouchableOpacity
              style={[styles.joinButton, (!selectedRoute || !isConnected) && styles.joinButtonDisabled]}
              onPress={handleJoinRoute}
              disabled={!selectedRoute || !isConnected}
            >
              <LinearGradient
                colors={!selectedRoute || !isConnected ? ['#ccc', '#999'] : [FlowColors.primary, '#0c7db8']}
                style={styles.joinButtonGradient}
              >
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.joinButtonText}>Find Carpools on This Route</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* Route Users */
          <View style={styles.routeUsers}>
            <View style={styles.currentRouteCard}>
              <Text style={styles.currentRouteTitle}>
                🚗 {selectedRoute?.from} → {selectedRoute?.to}
              </Text>
              <Text style={styles.currentRouteSubtitle}>
                {routeUsers.length} other{routeUsers.length !== 1 ? 's' : ''} on this route
              </Text>
            </View>

            {routeUsers.length === 0 ? (
              <View style={styles.noUsersCard}>
                <Ionicons name="people-outline" size={48} color="#999" />
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
                          {getTimeAgo(routeUser.joinedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => handleStartChat(routeUser)}
                  >
                    <LinearGradient
                      colors={[FlowColors.primary, '#0c7db8']}
                      style={styles.chatButtonGradient}
                    >
                      <Ionicons name="chatbubble" size={16} color="white" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

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
              <Ionicons name="arrow-back" size={24} color="white" />
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
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <LinearGradient
                colors={messageText.trim() ? [FlowColors.primary, '#0c7db8'] : ['#ccc', '#999']}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={16} color="white" />
              </LinearGradient>
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
    backgroundColor: '#0a0e13',
  },
  header: {
    backgroundColor: '#111c22',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 20,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  routeSelection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 25,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  routeCardSelected: {
    borderColor: FlowColors.primary,
    backgroundColor: '#0f172a',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 12,
  },
  routeTextSelected: {
    color: FlowColors.primary,
  },
  userTypeSection: {
    marginTop: 30,
    marginBottom: 30,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 15,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  userTypeButtonActive: {
    backgroundColor: FlowColors.primary,
    borderColor: FlowColors.primary,
  },
  userTypeButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  userTypeButtonTextActive: {
    color: 'white',
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  routeUsers: {
    padding: 20,
  },
  currentRouteCard: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: FlowColors.primary,
  },
  currentRouteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
  },
  currentRouteSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  noUsersCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  noUsersText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 15,
    marginBottom: 5,
  },
  noUsersSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
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
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userRoute: {
    fontSize: 14,
    color: '#94a3b8',
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
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  joinedTime: {
    fontSize: 12,
    color: '#64748b',
  },
  chatButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0a0e13',
  },
  chatHeader: {
    backgroundColor: '#111c22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
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
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#374151',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 20,
  },
  systemMessageText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#111c22',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#1e293b',
    color: 'white',
  },
  sendButton: {
    marginLeft: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleCarpoolScreen;