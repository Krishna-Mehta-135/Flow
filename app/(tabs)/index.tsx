import { Ionicons } from '@expo/vector-icons';
import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import FlowIcon from '@/components/ui/FlowIcon';
import GradientCard from '@/components/ui/GradientCard';
import StatusIndicator from '@/components/ui/StatusIndicator';
import healthService from '@/services/healthService';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const { user } = useAuth();
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'loading'>('loading');

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setBackendStatus('loading');
    const isHealthy = await healthService.ping();
    setBackendStatus(isHealthy ? 'online' : 'offline');
  };

  const quickActions = [
    {
      id: '1',
      title: 'Create Carpool',
      subtitle: 'Offer a ride to others',
      icon: 'car' as const,
      color: FlowColors.primary,
      route: '/create-carpool',
    },
    {
      id: '2',
      title: 'Find Ride',
      subtitle: 'Join an existing carpool',
      icon: 'search' as const,
      color: '#10b981',
      route: '/(tabs)/carpools',
    },
    {
      id: '3',
      title: 'Request Ride',
      subtitle: 'Post your travel request',
      icon: 'hand-left' as const,
      color: '#f59e0b',
      route: '/request-ride',
    },
    {
      id: '4',
      title: 'My Trips',
      subtitle: 'View your upcoming trips',
      icon: 'calendar' as const,
      color: '#8b5cf6',
      route: '/(tabs)/requests',
    },
  ];

  const stats = [
    { label: 'Trips Taken', value: '12', icon: 'car-sport' as const },
    { label: 'Money Saved', value: '₹2,400', icon: 'wallet' as const },
    { label: 'CO₂ Reduced', value: '45kg', icon: 'leaf' as const },
  ];

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={FlowColors.backgroundDark} />
      
      <LinearGradient
        colors={[FlowColors.backgroundDark, '#1f2937']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.username}>{user?.username}!</Text>
              <StatusIndicator 
                status={backendStatus} 
                label={backendStatus === 'online' ? 'Connected' : backendStatus === 'offline' ? 'Offline' : 'Connecting...'}
                size="small"
              />
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <FlowIcon size={40} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Impact</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <GradientCard key={index} variant="glass" style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name={stat.icon} size={24} color={FlowColors.primary} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GradientCard>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => handleQuickAction(action.route)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                    style={styles.actionCardGradient}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                      <Ionicons name={action.icon} size={24} color="#ffffff" />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.recentContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <GradientCard variant="glass" style={styles.activityCard}>
              <View style={styles.activityContent}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>Trip to Sector 18 completed</Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
              </View>
            </GradientCard>

            <GradientCard variant="glass" style={styles.activityCard}>
              <View style={styles.activityContent}>
                <View style={styles.activityIcon}>
                  <Ionicons name="add-circle" size={20} color={FlowColors.primary} />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>New carpool created</Text>
                  <Text style={styles.activityTime}>1 day ago</Text>
                </View>
              </View>
            </GradientCard>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FlowColors.backgroundDark,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
  },
  profileButton: {
    marginLeft: 16,
  },
  
  // Stats Section
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Recent Activity
  recentContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: FlowColors.primary,
    fontFamily: 'SpaceMono',
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'SpaceMono',
  },
  bottomSpacing: {
    height: 40,
  },
});
