import { IconSymbol } from '@/components/ui/IconSymbol';
import carpoolService, { Carpool } from '@/services/carpoolService';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CarpoolsScreen() {
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCarpools();
  }, []);

  const loadCarpools = async () => {
    try {
      setIsLoading(true);
      const data = await carpoolService.getCarpools();
      setCarpools(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCarpools();
    setRefreshing(false);
  };

  const handleJoinCarpool = async (carpoolId: string) => {
    try {
      await carpoolService.joinCarpool(carpoolId);
      Alert.alert('Success', 'Successfully joined the carpool!');
      loadCarpools(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderCarpoolItem = ({ item }: { item: Carpool }) => (
    <View style={styles.carpoolCard}>
      <View style={styles.carpoolHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.status}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={styles.price}>${item.pricePerSeat}/seat</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <IconSymbol name="circle.fill" size={12} color="#34C759" />
          <Text style={styles.locationText}>
            {item.startLocation.address || `${item.startLocation.latitude}, ${item.startLocation.longitude}`}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.locationRow}>
          <IconSymbol name="circle.fill" size={12} color="#FF3B30" />
          <Text style={styles.locationText}>
            {item.endLocation.address || `${item.endLocation.latitude}, ${item.endLocation.longitude}`}
          </Text>
        </View>
      </View>

      <View style={styles.carpoolDetails}>
        <View style={styles.detailRow}>
          <IconSymbol name="clock" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.departureTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <IconSymbol name="person.2" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.availableSeats} seat{item.availableSeats !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>

      {item.status === 'active' && item.availableSeats > 0 && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinCarpool(item._id)}
        >
          <Text style={styles.joinButtonText}>Join Carpool</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'completed':
        return '#007AFF';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading carpools...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Carpools</Text>
      </View>

      {carpools.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="car" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No carpools available</Text>
          <Text style={styles.emptySubtext}>
            Be the first to create a carpool!
          </Text>
        </View>
      ) : (
        <FlatList
          data={carpools}
          renderItem={renderCarpoolItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  carpoolCard: {
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
  carpoolHeader: {
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
    marginRight: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginBottom: 8,
  },
  carpoolDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
