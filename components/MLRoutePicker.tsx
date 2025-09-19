import { FlowColors } from '@/constants/Colors';
import { MLSupportedRoute, getPopularRoutes, searchRoutes } from '@/services/mlSupportedRoutes';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
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

interface MLRoutePickerProps {
  visible: boolean;
  onRouteSelect: (route: MLSupportedRoute) => void;
  onClose: () => void;
  title: string;
  placeholder?: string;
  mode: 'origin' | 'destination' | 'full-route';
}

const MLRoutePicker: React.FC<MLRoutePickerProps> = ({
  visible,
  onRouteSelect,
  onClose,
  title,
  placeholder = "Search routes...",
  mode = 'full-route'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState<MLSupportedRoute[]>([]);
  const [showPopular, setShowPopular] = useState(true);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredRoutes(searchRoutes(searchQuery));
      setShowPopular(false);
    } else {
      setFilteredRoutes([]); // Show nothing by default - clean UI
      setShowPopular(false);
    }
  }, [searchQuery]);

  const popularRoutes = getPopularRoutes();

  const handleRouteSelect = (route: MLSupportedRoute) => {
    onRouteSelect(route);
    setSearchQuery('');
  };

  const renderRouteItem = (route: MLSupportedRoute) => (
    <TouchableOpacity
      key={route.id}
      style={styles.routeItem}
      onPress={() => handleRouteSelect(route)}
    >
      <BlurView intensity={20} style={styles.routeItemBlur}>
        <View style={styles.routeInfo}>
          <View style={styles.routeHeader}>
            <Ionicons name="location" size={16} color={FlowColors.primary} />
            <Text style={styles.routeDescription}>{route.description}</Text>
          </View>
          <View style={styles.routeDetails}>
            <View style={styles.routeSegment}>
              <Ionicons name="radio-button-on" size={12} color="#10b981" />
              <Text style={styles.routeOrigin}>{route.origin}</Text>
            </View>
            <View style={styles.routeArrow}>
              <Ionicons name="arrow-forward" size={12} color="rgba(255, 255, 255, 0.4)" />
            </View>
            <View style={styles.routeSegment}>
              <Ionicons name="location" size={12} color="#ff4757" />
              <Text style={styles.routeDestination}>{route.destination}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f14" />
        
        <LinearGradient
          colors={['#0a0f14', '#1a1f2e', '#0a0f14']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <BlurView intensity={20} style={styles.searchBlur}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
              )}
            </BlurView>
          </View>

          {/* ML Prediction Badge */}
          <View style={styles.mlBadgeContainer}>
            <BlurView intensity={20} style={styles.mlBadge}>
              <Ionicons name="analytics" size={16} color="#10b981" />
              <Text style={styles.mlBadgeText}>
                💡 Start typing to find AI-supported routes
              </Text>
            </BlurView>
          </View>

          {/* Smart Suggestions - only show when typing */}
          {searchQuery.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {filteredRoutes.length > 0 
                  ? `� Found ${filteredRoutes.length} route${filteredRoutes.length !== 1 ? 's' : ''}`
                  : '❌ No matching routes'
                }
              </Text>
              <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false}>
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map(renderRouteItem)
                ) : (
                  <View style={styles.noResults}>
                    <Ionicons name="search" size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={styles.noResultsTitle}>No routes found</Text>
                    <Text style={styles.noResultsText}>
                      Try: "airport", "cp", "noida", "gurgaon", "metro", etc.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Clean UI when no search */}
          {searchQuery.length === 0 && (
            <View style={styles.cleanUIContainer}>
              <Ionicons name="search" size={64} color="rgba(255, 255, 255, 0.2)" />
              <Text style={styles.cleanUITitle}>Smart Route Search</Text>
              <Text style={styles.cleanUISubtitle}>
                Type any location to see AI-powered route suggestions
              </Text>
              
              {/* Quick Examples */}
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Try searching:</Text>
                <View style={styles.exampleTags}>
                  {['Airport', 'CP', 'Noida', 'Gurgaon', 'Metro'].map((example, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.exampleTag}
                      onPress={() => setSearchQuery(example.toLowerCase())}
                    >
                      <Text style={styles.exampleTagText}>{example}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f14',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: -28,
  },
  headerSpacer: {
    width: 28,
  },
  searchContainer: {
    padding: 20,
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  mlBadgeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  mlBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  popularScroll: {
    marginBottom: 10,
  },
  popularRoute: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  popularRouteBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  popularRouteText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  routesList: {
    maxHeight: 400,
  },
  routeItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  routeItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeInfo: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  routeDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  routeArrow: {
    paddingHorizontal: 4,
  },
  routeOrigin: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    flex: 1,
  },
  routeDestination: {
    fontSize: 12,
    color: '#ff4757',
    fontWeight: '500',
    flex: 1,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  cleanUIContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  cleanUITitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  cleanUISubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  examplesContainer: {
    alignItems: 'center',
    width: '100%',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  exampleTag: {
    backgroundColor: 'rgba(17, 147, 212, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(17, 147, 212, 0.3)',
  },
  exampleTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: FlowColors.primary,
  },
});

export default MLRoutePicker;