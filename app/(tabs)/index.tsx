import FlowIcon from '@/components/ui/FlowIcon';
import GradientCard from '@/components/ui/GradientCard';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { FlowColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import healthService from '@/services/healthService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
      title: '� Future Traffic',
      subtitle: 'When should I leave?',
      icon: 'time' as const,
      color: '#f59e0b',
      route: '/traffic-predictor',
    },
    {
      id: '2',
      title: '🚗 Plan Carpool',
      subtitle: 'Share the journey',
      icon: 'people' as const,
      color: FlowColors.primary,
      route: '/smart-carpool',
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
    { label: 'Active Rides', value: '3', icon: 'car-sport' as const, trend: '+2 today' },
    { label: 'Money Saved', value: '₹2,400', icon: 'wallet' as const, trend: '₹150 this week' },
    { label: 'CO₂ Reduced', value: '45kg', icon: 'leaf' as const, trend: '12% vs last month' },
  ];

  const recentActivities = [
    {
      id: '1',
      title: 'Trip to Connaught Place completed',
      subtitle: 'Saved ₹120 • 3 co-riders',
      time: '2 hours ago',
      icon: 'checkmark-circle' as const,
      iconColor: '#10b981',
    },
    {
      id: '2', 
      title: 'Matched with carpool to Gurgaon',
      subtitle: 'Pickup at 9:00 AM • ₹80 per person',
      time: '4 hours ago',
      icon: 'people' as const,
      iconColor: FlowColors.primary,
    },
    {
      id: '3',
      title: 'New ride request posted',
      subtitle: 'Sector 18 to Airport • Tomorrow 6 PM',
      time: '1 day ago',
      icon: 'add-circle' as const,
      iconColor: '#f59e0b',
    },
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
                  <Text style={styles.statTrend}>{stat.trend}</Text>
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
            
            {recentActivities.map((activity) => (
              <GradientCard key={activity.id} variant="glass" style={styles.activityCard}>
                <View style={styles.activityContent}>
                  <View style={[styles.activityIcon, { backgroundColor: activity.iconColor + '20' }]}>
                    <Ionicons name={activity.icon} size={20} color={activity.iconColor} />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              </GradientCard>
            ))}
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
  statTrend: {
    fontSize: 10,
    color: '#10b981',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 2,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'SpaceMono',
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
