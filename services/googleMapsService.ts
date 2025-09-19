// Google Maps configuration and types
export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
}

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  heading?: number; // direction of movement
  speed?: number; // km/h
}

export interface LiveCarpoolRequest {
  id: string;
  userId: string;
  userProfile: {
    name: string;
    rating: number;
    photo: string;
    phone: string;
  };
  currentLocation: UserLocation;
  route: {
    origin: string;
    destination: string;
    originCoords: { lat: number; lng: number };
    destinationCoords: { lat: number; lng: number };
  };
  departureTime: string;
  requestType: 'driver' | 'passenger';
  seatsAvailable?: number; // for drivers
  seatsNeeded?: number; // for passengers
  preferences: {
    maxDetour: number; // km
    maxWaitTime: number; // minutes
    priceRange: { min: number; max: number };
  };
  status: 'searching' | 'matched' | 'en_route' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

export interface CarpoolMatch {
  id: string;
  driver: LiveCarpoolRequest;
  passengers: LiveCarpoolRequest[];
  route: {
    optimizedPath: google.maps.LatLng[];
    totalDistance: number;
    estimatedDuration: number;
    pickupPoints: Array<{
      userId: string;
      location: google.maps.LatLng;
      estimatedArrival: string;
    }>;
  };
  pricing: {
    costPerPassenger: number;
    driverEarnings: number;
    platformFee: number;
  };
  matchScore: number; // 0-100 based on proximity, route similarity, ratings
  createdAt: string;
}

// Google Maps Service Class
export class GoogleMapsService {
  private apiKey: string;
  private map: google.maps.Map | null = null;
  private directionsService: google.maps.DirectionsService | null = null;
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Initialize Google Maps
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined') {
        this.directionsService = new google.maps.DirectionsService();
        this.distanceMatrixService = new google.maps.DistanceMatrixService();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.directionsService = new google.maps.DirectionsService();
        this.distanceMatrixService = new google.maps.DistanceMatrixService();
        resolve();
      };
      
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Get user's current location
  async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            userId: '', // Will be set by caller
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            heading: position.coords.heading || undefined,
            speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // 30 seconds
        }
      );
    });
  }

  // Watch user location for live tracking
  watchLocation(callback: (location: UserLocation) => void): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          userId: '', // Will be set by caller
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          heading: position.coords.heading || undefined,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
        });
      },
      (error) => console.error('Location watch error:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // 5 seconds for live tracking
      }
    );
  }

  // Stop watching location
  clearLocationWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  // Calculate distance between two points
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    if (!google?.maps?.geometry) {
      // Fallback Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = this.toRadians(point2.lat - point1.lat);
      const dLng = this.toRadians(point2.lng - point1.lng);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
    const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);
    return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2) / 1000; // Convert to km
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get optimized route with multiple waypoints
  async getOptimizedRoute(
    origin: google.maps.LatLng,
    destination: google.maps.LatLng,
    waypoints: google.maps.LatLng[]
  ): Promise<google.maps.DirectionsResult> {
    if (!this.directionsService) {
      throw new Error('Directions service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.directionsService!.route(
        {
          origin,
          destination,
          waypoints: waypoints.map(point => ({
            location: point,
            stopover: true,
          })),
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  }

  // Calculate distances between multiple points
  async getDistanceMatrix(
    origins: google.maps.LatLng[],
    destinations: google.maps.LatLng[]
  ): Promise<google.maps.DistanceMatrixResponse> {
    if (!this.distanceMatrixService) {
      throw new Error('Distance Matrix service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.distanceMatrixService!.getDistanceMatrix(
        {
          origins,
          destinations,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        },
        (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            resolve(response);
          } else {
            reject(new Error(`Distance Matrix request failed: ${status}`));
          }
        }
      );
    });
  }
}

// Live Carpool Matching Service
export class LiveCarpoolMatcher {
  private googleMapsService: GoogleMapsService;
  private activeRequests: Map<string, LiveCarpoolRequest> = new Map();
  private locationWatchers: Map<string, number> = new Map();

  constructor(googleMapsService: GoogleMapsService) {
    this.googleMapsService = googleMapsService;
  }

  // Start live carpool request
  async startLiveCarpoolRequest(
    request: Omit<LiveCarpoolRequest, 'id' | 'currentLocation' | 'createdAt' | 'expiresAt' | 'status'>
  ): Promise<LiveCarpoolRequest> {
    const currentLocation = await this.googleMapsService.getCurrentLocation();
    currentLocation.userId = request.userId;

    const liveCarpoolRequest: LiveCarpoolRequest = {
      ...request,
      id: `carpool_${Date.now()}_${request.userId}`,
      currentLocation,
      status: 'searching',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };

    this.activeRequests.set(liveCarpoolRequest.id, liveCarpoolRequest);

    // Start location tracking
    const watchId = this.googleMapsService.watchLocation((location) => {
      location.userId = request.userId;
      this.updateUserLocation(liveCarpoolRequest.id, location);
    });
    
    this.locationWatchers.set(liveCarpoolRequest.id, watchId);

    return liveCarpoolRequest;
  }

  // Update user location
  private updateUserLocation(requestId: string, location: UserLocation): void {
    const request = this.activeRequests.get(requestId);
    if (request) {
      request.currentLocation = location;
      this.activeRequests.set(requestId, request);
      
      // Trigger real-time matching
      this.findLiveMatches(requestId);
    }
  }

  // Find live matches for a user
  private async findLiveMatches(requestId: string): Promise<CarpoolMatch[]> {
    const userRequest = this.activeRequests.get(requestId);
    if (!userRequest) return [];

    const potentialMatches: LiveCarpoolRequest[] = [];
    
    // Find users with complementary requests (drivers vs passengers)
    for (const [_, request] of this.activeRequests) {
      if (request.id === requestId) continue;
      if (request.status !== 'searching') continue;
      
      // Match drivers with passengers and vice versa
      if (
        (userRequest.requestType === 'driver' && request.requestType === 'passenger') ||
        (userRequest.requestType === 'passenger' && request.requestType === 'driver')
      ) {
        // Check proximity (within max detour range)
        const distance = this.googleMapsService.calculateDistance(
          {
            lat: userRequest.currentLocation.latitude,
            lng: userRequest.currentLocation.longitude,
          },
          {
            lat: request.currentLocation.latitude,
            lng: request.currentLocation.longitude,
          }
        );

        const maxDetour = Math.max(
          userRequest.preferences.maxDetour,
          request.preferences.maxDetour
        );

        if (distance <= maxDetour) {
          potentialMatches.push(request);
        }
      }
    }

    // Create matches and calculate scores
    const matches: CarpoolMatch[] = [];
    
    for (const match of potentialMatches) {
      const matchScore = await this.calculateMatchScore(userRequest, match);
      
      if (matchScore >= 60) { // Minimum match threshold
        const optimizedRoute = await this.calculateOptimizedRoute(userRequest, match);
        
        matches.push({
          id: `match_${Date.now()}_${userRequest.id}_${match.id}`,
          driver: userRequest.requestType === 'driver' ? userRequest : match,
          passengers: userRequest.requestType === 'passenger' ? [userRequest] : [match],
          route: optimizedRoute,
          pricing: this.calculatePricing(userRequest, match, optimizedRoute),
          matchScore,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  // Calculate match score between two users
  private async calculateMatchScore(
    user1: LiveCarpoolRequest,
    user2: LiveCarpoolRequest
  ): Promise<number> {
    let score = 0;

    // 1. Proximity score (40% weight)
    const currentDistance = this.googleMapsService.calculateDistance(
      { lat: user1.currentLocation.latitude, lng: user1.currentLocation.longitude },
      { lat: user2.currentLocation.latitude, lng: user2.currentLocation.longitude }
    );
    const maxDetour = Math.max(user1.preferences.maxDetour, user2.preferences.maxDetour);
    const proximityScore = Math.max(0, (maxDetour - currentDistance) / maxDetour) * 40;
    score += proximityScore;

    // 2. Route similarity score (30% weight)
    const routeSimilarity = await this.calculateRouteSimilarity(user1, user2);
    score += routeSimilarity * 30;

    // 3. User ratings score (20% weight)
    const avgRating = (user1.userProfile.rating + user2.userProfile.rating) / 2;
    const ratingScore = (avgRating / 5) * 20;
    score += ratingScore;

    // 4. Time compatibility score (10% weight)
    const timeDiff = Math.abs(
      new Date(user1.departureTime).getTime() - new Date(user2.departureTime).getTime()
    );
    const maxWaitTime = Math.max(
      user1.preferences.maxWaitTime,
      user2.preferences.maxWaitTime
    ) * 60 * 1000; // Convert to milliseconds
    const timeScore = Math.max(0, (maxWaitTime - timeDiff) / maxWaitTime) * 10;
    score += timeScore;

    return Math.round(score);
  }

  // Calculate route similarity
  private async calculateRouteSimilarity(
    user1: LiveCarpoolRequest,
    user2: LiveCarpoolRequest
  ): Promise<number> {
    try {
      // Calculate distances between route points
      const origins = [
        new google.maps.LatLng(user1.route.originCoords.lat, user1.route.originCoords.lng),
        new google.maps.LatLng(user1.route.destinationCoords.lat, user1.route.destinationCoords.lng),
      ];
      
      const destinations = [
        new google.maps.LatLng(user2.route.originCoords.lat, user2.route.originCoords.lng),
        new google.maps.LatLng(user2.route.destinationCoords.lat, user2.route.destinationCoords.lng),
      ];

      const matrix = await this.googleMapsService.getDistanceMatrix(origins, destinations);
      
      // Calculate similarity based on how close the routes are
      const originDistance = matrix.rows[0].elements[0].distance?.value || Infinity;
      const destDistance = matrix.rows[1].elements[1].distance?.value || Infinity;
      
      const avgDistance = (originDistance + destDistance) / 2 / 1000; // Convert to km
      const maxAcceptableDistance = 5; // 5km max difference
      
      return Math.max(0, (maxAcceptableDistance - avgDistance) / maxAcceptableDistance);
    } catch (error) {
      console.error('Route similarity calculation error:', error);
      return 0;
    }
  }

  // Calculate optimized route for carpool
  private async calculateOptimizedRoute(
    user1: LiveCarpoolRequest,
    user2: LiveCarpoolRequest
  ): Promise<CarpoolMatch['route']> {
    const driver = user1.requestType === 'driver' ? user1 : user2;
    const passenger = user1.requestType === 'passenger' ? user1 : user2;

    const waypoints = [
      new google.maps.LatLng(passenger.currentLocation.latitude, passenger.currentLocation.longitude),
    ];

    try {
      const route = await this.googleMapsService.getOptimizedRoute(
        new google.maps.LatLng(driver.currentLocation.latitude, driver.currentLocation.longitude),
        new google.maps.LatLng(driver.route.destinationCoords.lat, driver.route.destinationCoords.lng),
        waypoints
      );

      const leg = route.routes[0].legs[0];
      
      return {
        optimizedPath: route.routes[0].overview_path,
        totalDistance: leg.distance?.value || 0,
        estimatedDuration: leg.duration?.value || 0,
        pickupPoints: [
          {
            userId: passenger.userId,
            location: waypoints[0],
            estimatedArrival: new Date(Date.now() + (leg.duration?.value || 0) * 1000).toISOString(),
          },
        ],
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  }

  // Calculate pricing for carpool
  private calculatePricing(
    user1: LiveCarpoolRequest,
    user2: LiveCarpoolRequest,
    route: CarpoolMatch['route']
  ): CarpoolMatch['pricing'] {
    const basePricePerKm = 2; // ₹2 per km
    const platformFeePercent = 0.15; // 15%
    
    const totalCost = (route.totalDistance / 1000) * basePricePerKm;
    const platformFee = totalCost * platformFeePercent;
    const costPerPassenger = totalCost + platformFee;
    const driverEarnings = totalCost - (totalCost * 0.05); // Driver gets 95% of base cost

    return {
      costPerPassenger: Math.round(costPerPassenger),
      driverEarnings: Math.round(driverEarnings),
      platformFee: Math.round(platformFee),
    };
  }

  // Stop carpool request
  stopCarpoolRequest(requestId: string): void {
    const watchId = this.locationWatchers.get(requestId);
    if (watchId) {
      this.googleMapsService.clearLocationWatch(watchId);
      this.locationWatchers.delete(requestId);
    }
    
    this.activeRequests.delete(requestId);
  }

  // Get active requests for a user
  getUserRequests(userId: string): LiveCarpoolRequest[] {
    return Array.from(this.activeRequests.values()).filter(
      request => request.userId === userId
    );
  }

  // Get all active requests (for admin/debugging)
  getAllActiveRequests(): LiveCarpoolRequest[] {
    return Array.from(this.activeRequests.values());
  }
}

export default GoogleMapsService;