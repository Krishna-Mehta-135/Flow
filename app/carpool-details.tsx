import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Member {
  id: string;
  name: string;
  rating: number;
  totalRides: number;
  avatar: string;
  isDriver?: boolean;
}

interface CostBreakdown {
  baseFare: number;
  distanceSurcharge: number;
  carpoolDiscount: number;
  total: number;
}

const CarpoolDetailsScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Sample data - in real app this would come from navigation params or API
  const carpoolData = {
    id: 'cp_123',
    route: 'Connaught Place → Gurgaon Cyber City',
    departureTime: '9:00 AM',
    estimatedArrival: '10:15 AM',
    status: 'confirmed',
  };

  const members: Member[] = [
    {
      id: '1',
      name: 'Ethan Carter',
      rating: 4.8,
      totalRides: 120,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isDriver: true,
    },
    {
      id: '2',
      name: 'Sophia Bennett',
      rating: 4.9,
      totalRides: 150,
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    {
      id: '3',
      name: 'Liam Harper',
      rating: 4.7,
      totalRides: 100,
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    {
      id: '4',
      name: 'You',
      rating: 4.6,
      totalRides: 85,
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
  ];

  const costBreakdown: CostBreakdown = {
    baseFare: 250,
    distanceSurcharge: 75,
    carpoolDiscount: -100,
    total: 225,
  };

  const handleMessageGroup = () => {
    Alert.alert(
      'Group Chat',
      'Opening group chat with all carpool members...',
      [{ text: 'OK' }]
    );
  };

  const handleCancelCarpool = () => {
    Alert.alert(
      'Cancel Carpool',
      'Are you sure you want to cancel this carpool? You may be charged a cancellation fee.',
      [
        { text: 'Keep Carpool', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              router.back();
            }, 2000);
          },
        },
      ]
    );
  };

  const handleCallDriver = () => {
    Alert.alert(
      'Call Driver',
      'Calling Ethan Carter...',
      [{ text: 'Cancel' }]
    );
  };

  const renderMember = (member: Member) => (
    <View key={member.id} style={styles.memberCard}>
      <BlurView intensity={20} style={styles.memberCardBlur}>
        <View style={styles.memberInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: member.avatar }} style={styles.avatar} />
            {member.isDriver && (
              <View style={styles.driverBadge}>
                <Ionicons name="car" size={12} color="white" />
              </View>
            )}
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{member.name}</Text>
            {member.isDriver && <Text style={styles.driverLabel}>Driver</Text>}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{member.rating}</Text>
              <Text style={styles.rideCount}>• {member.totalRides} rides</Text>
            </View>
          </View>
          {member.isDriver && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallDriver}
            >
              <Ionicons name="call" size={18} color="#1193d4" />
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </View>
  );

  const renderCostItem = (label: string, amount: number, isDiscount = false) => (
    <View style={styles.costItem}>
      <Text style={styles.costLabel}>{label}</Text>
      <Text style={[
        styles.costAmount,
        isDiscount && styles.discountAmount
      ]}>
        {isDiscount ? '-' : ''}₹{Math.abs(amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />
      
      {/* Header */}
      <BlurView intensity={80} style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carpool Details</Text>
        <View style={styles.headerSpacer} />
      </BlurView>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Info Card */}
        <View style={styles.tripCard}>
          <BlurView intensity={20} style={styles.tripCardBlur}>
            <View style={styles.tripHeader}>
              <View style={styles.tripIcon}>
                <Ionicons name="location" size={20} color="#1193d4" />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripRoute}>{carpoolData.route}</Text>
                <Text style={styles.tripTime}>
                  {carpoolData.departureTime} - {carpoolData.estimatedArrival}
                </Text>
              </View>
              <View style={[styles.statusBadge, styles.confirmedBadge]}>
                <Text style={styles.statusText}>Confirmed</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <View style={styles.membersContainer}>
            {members.map(renderMember)}
          </View>
        </View>

        {/* Pickup Location Map Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.mapContainer}>
            <BlurView intensity={10} style={styles.mapPlaceholder}>
              <LinearGradient
                colors={['rgba(17, 147, 212, 0.3)', 'rgba(17, 147, 212, 0.1)']}
                style={styles.mapGradient}
              >
                <Ionicons name="map" size={48} color="rgba(17, 147, 212, 0.8)" />
                <Text style={styles.mapText}>Connaught Place</Text>
                <Text style={styles.mapSubtext}>Metro Station Gate 4</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <View style={styles.costCard}>
            <BlurView intensity={20} style={styles.costCardBlur}>
              <View style={styles.costBreakdown}>
                {renderCostItem('Base Fare', costBreakdown.baseFare)}
                {renderCostItem('Distance Surcharge', costBreakdown.distanceSurcharge)}
                {renderCostItem('Carpool Discount', costBreakdown.carpoolDiscount, true)}
              </View>
              <View style={styles.costDivider} />
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{costBreakdown.total}</Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleMessageGroup}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#1193d4', '#0c7db8']}
              style={styles.buttonGradient}
            >
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Message Group</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCancelCarpool}
            disabled={isLoading}
          >
            <BlurView intensity={20} style={styles.secondaryButtonBlur}>
              <Ionicons name="close-circle" size={20} color="#ff4757" />
              <Text style={styles.secondaryButtonText}>Cancel Carpool</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <BlurView intensity={100} style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Cancelling carpool...</Text>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: -28, // Compensate for back button
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  tripCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tripCardBlur: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  tripTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ed573',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  memberCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(17, 147, 212, 0.3)',
  },
  driverBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1193d4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0f14',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  driverLabel: {
    fontSize: 12,
    color: '#1193d4',
    fontWeight: '500',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
  rideCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mapGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  costCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  costCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  costBreakdown: {
    padding: 20,
    gap: 12,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  discountAmount: {
    color: '#2ed573',
  },
  costDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1193d4',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  secondaryButtonBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4757',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default CarpoolDetailsScreen;