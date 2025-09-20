import carpoolService, { RideRequest } from '@/services/carpoolService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await carpoolService.getRideRequests();
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await carpoolService.cancelRideRequest(requestId);
              Alert.alert('Success', 'Ride request cancelled successfully');
              loadRequests();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'matched':
        return '#34C759';
      case 'completed':
        return '#007AFF';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'matched':
        return 'checkmark-circle';
      case 'completed':
        return 'flag';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderRequestItem = ({ item }: { item: RideRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.requestDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="ellipse" size={12} color="#34C759" />
          <Text style={styles.locationText}>
            {item.startLocation?.address || `${item.startLocation?.latitude || 'N/A'}, ${item.startLocation?.longitude || 'N/A'}`}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.locationRow}>
          <Ionicons name="ellipse" size={12} color="#FF3B30" />
          <Text style={styles.locationText}>
            {item.endLocation?.address || `${item.endLocation?.latitude || 'N/A'}, ${item.endLocation?.longitude || 'N/A'}`}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>Requested for: {formatDate(item.requestedTime)}</Text>
        </View>
        {item.carpoolId && (
          <View style={styles.detailRow}>
            <Ionicons name="car" size={16} color="#666" />
            <Text style={styles.detailText}>Matched to carpool</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelRequest(item._id)}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.cancelButtonGradient}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {item.status === 'matched' && (
        <View style={styles.matchedInfo}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.matchedText}>Your ride has been matched!</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111c22" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111c22" />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <BlurView intensity={80} style={styles.headerContent}>
          <Text style={styles.title}>My Ride Requests</Text>
        </BlurView>
      </SafeAreaView>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="hand-right" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No ride requests</Text>
          <Text style={styles.emptySubtext}>
            Start by requesting a ride!
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  requestDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#475569',
    marginLeft: 5,
    marginBottom: 8,
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 8,
  },
  cancelButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  matchedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  matchedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
});
