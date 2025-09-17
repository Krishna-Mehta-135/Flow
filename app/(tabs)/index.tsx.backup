import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();

  const handleCreateCarpool = () => {
    router.push('/create-carpool');
  };

  const handleRequestRide = () => {
    router.push('/request-ride');
  };

  const handleViewCarpools = () => {
    router.push('/(tabs)/carpools');
  };

  const handleViewRequests = () => {
    router.push('/(tabs)/requests');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{user?.username}!</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleCreateCarpool}>
              <View style={styles.actionIconContainer}>
                <IconSymbol name="car.fill" size={32} color="#007AFF" />
              </View>
              <Text style={styles.actionTitle}>Create Carpool</Text>
              <Text style={styles.actionSubtitle}>Offer a ride to others</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleRequestRide}>
              <View style={styles.actionIconContainer}>
                <IconSymbol name="hand.raised.fill" size={32} color="#34C759" />
              </View>
              <Text style={styles.actionTitle}>Request Ride</Text>
              <Text style={styles.actionSubtitle}>Find a ride you need</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewCarpools}>
              <View style={styles.actionIconContainer}>
                <IconSymbol name="list.bullet" size={32} color="#FF9500" />
              </View>
              <Text style={styles.actionTitle}>Browse Carpools</Text>
              <Text style={styles.actionSubtitle}>See available rides</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewRequests}>
              <View style={styles.actionIconContainer}>
                <IconSymbol name="clock.fill" size={32} color="#FF3B30" />
              </View>
              <Text style={styles.actionTitle}>My Requests</Text>
              <Text style={styles.actionSubtitle}>Track your rides</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <IconSymbol name="clock" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by creating a carpool or requesting a ride!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 18,
    color: '#666',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  quickActions: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  recentActivity: {
    padding: 24,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
