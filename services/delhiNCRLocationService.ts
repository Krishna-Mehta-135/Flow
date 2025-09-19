interface DelhiNCRLocation {
  name: string;
  area: string;
  city: string;
  state: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'metro_station' | 'mall' | 'airport' | 'hospital' | 'university' | 'landmark' | 'residential';
}

// Popular Delhi NCR locations with coordinates
const DELHI_NCR_LOCATIONS: DelhiNCRLocation[] = [
  // Metro Stations
  { name: 'Rajiv Chowk Metro Station', area: 'Connaught Place', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.6328, longitude: 77.2197 }, type: 'metro_station' },
  { name: 'Kashmere Gate Metro Station', area: 'Kashmere Gate', city: 'Delhi', state: 'Delhi', coordinates: { latitude: 28.6677, longitude: 77.2273 }, type: 'metro_station' },
  { name: 'Dwarka Sector 21 Metro Station', area: 'Dwarka', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5525, longitude: 77.0589 }, type: 'metro_station' },
  { name: 'Huda City Centre Metro Station', area: 'Sector 29', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.4595, longitude: 77.0266 }, type: 'metro_station' },
  { name: 'Noida City Centre Metro Station', area: 'Sector 32', city: 'Noida', state: 'Uttar Pradesh', coordinates: { latitude: 28.5746, longitude: 77.3560 }, type: 'metro_station' },
  
  // Airports
  { name: 'Indira Gandhi International Airport', area: 'Terminal 3', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5562, longitude: 77.1000 }, type: 'airport' },
  { name: 'IGI Airport Terminal 1', area: 'Terminal 1', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5665, longitude: 77.1031 }, type: 'airport' },
  
  // Malls & Shopping
  { name: 'Select City Walk', area: 'Saket', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5244, longitude: 77.2066 }, type: 'mall' },
  { name: 'DLF Mall of India', area: 'Sector 18', city: 'Noida', state: 'Uttar Pradesh', coordinates: { latitude: 28.5677, longitude: 77.3242 }, type: 'mall' },
  { name: 'Cyber Hub', area: 'DLF Cyber City', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.4942, longitude: 77.0869 }, type: 'mall' },
  { name: 'Connaught Place', area: 'CP', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.6315, longitude: 77.2167 }, type: 'landmark' },
  
  // Universities & Colleges
  { name: 'Delhi University', area: 'North Campus', city: 'Delhi', state: 'Delhi', coordinates: { latitude: 28.6927, longitude: 77.2085 }, type: 'university' },
  { name: 'JNU', area: 'Jawaharlal Nehru University', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5383, longitude: 77.1641 }, type: 'university' },
  { name: 'IIT Delhi', area: 'Hauz Khas', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5448, longitude: 77.1928 }, type: 'university' },
  
  // Hospitals
  { name: 'AIIMS Delhi', area: 'Ansari Nagar', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5672, longitude: 77.2100 }, type: 'hospital' },
  { name: 'Max Hospital Saket', area: 'Saket', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5244, longitude: 77.2066 }, type: 'hospital' },
  { name: 'Fortis Hospital Gurugram', area: 'Sector 44', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.4403, longitude: 77.0488 }, type: 'hospital' },
  
  // Popular Areas
  { name: 'Karol Bagh', area: 'Karol Bagh', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.6507, longitude: 77.1901 }, type: 'residential' },
  { name: 'Lajpat Nagar', area: 'Lajpat Nagar', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5677, longitude: 77.2434 }, type: 'residential' },
  { name: 'Sector 62 Noida', area: 'Sector 62', city: 'Noida', state: 'Uttar Pradesh', coordinates: { latitude: 28.6274, longitude: 77.3646 }, type: 'residential' },
  { name: 'Cyber City Gurugram', area: 'DLF Cyber City', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.4947, longitude: 77.0869 }, type: 'residential' },
  { name: 'Hauz Khas Village', area: 'Hauz Khas', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5494, longitude: 77.1917 }, type: 'landmark' },
  { name: 'Khan Market', area: 'Khan Market', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5986, longitude: 77.2297 }, type: 'landmark' },
  { name: 'Dilli Haat', area: 'INA', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5741, longitude: 77.2070 }, type: 'landmark' },
  
  // Tech Hubs & Business Areas
  { name: 'Noida Sector 16', area: 'Sector 16', city: 'Noida', state: 'Uttar Pradesh', coordinates: { latitude: 28.5833, longitude: 77.3167 }, type: 'residential' },
  { name: 'Golf Course Road', area: 'Golf Course Road', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.4707, longitude: 77.0743 }, type: 'residential' },
  { name: 'Nehru Place', area: 'Nehru Place', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5494, longitude: 77.2506 }, type: 'landmark' },
  { name: 'Rajouri Garden', area: 'Rajouri Garden', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.6469, longitude: 77.1202 }, type: 'residential' },
  { name: 'Vasant Kunj', area: 'Vasant Kunj', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5200, longitude: 77.1588 }, type: 'residential' },
  { name: 'Greater Kailash', area: 'GK-1', city: 'New Delhi', state: 'Delhi', coordinates: { latitude: 28.5494, longitude: 77.2347 }, type: 'residential' },
  { name: 'Faridabad Sector 21', area: 'Sector 21', city: 'Faridabad', state: 'Haryana', coordinates: { latitude: 28.4089, longitude: 77.3178 }, type: 'residential' },
  { name: 'Ghaziabad Railway Station', area: 'Railway Road', city: 'Ghaziabad', state: 'Uttar Pradesh', coordinates: { latitude: 28.6692, longitude: 77.4538 }, type: 'landmark' },
  
  // Tech Parks & Business Areas
  { name: 'Unitech Cyber Park', area: 'Sector 39', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.4329, longitude: 77.0671 }, type: 'residential' },
  { name: 'Logix City Centre', area: 'Sector 32', city: 'Noida', state: 'Uttar Pradesh', coordinates: { latitude: 28.5736, longitude: 77.3589 }, type: 'mall' },
  { name: 'Ambience Mall Gurugram', area: 'Ambience Island', city: 'Gurugram', state: 'Haryana', coordinates: { latitude: 28.5021, longitude: 77.1095 }, type: 'mall' },
];

class DelhiNCRLocationService {
  searchLocations(query: string): DelhiNCRLocation[] {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    
    return DELHI_NCR_LOCATIONS.filter(location => {
      const searchableText = `${location.name} ${location.area} ${location.city}`.toLowerCase();
      return searchableText.includes(searchTerm);
    }).slice(0, 8); // Limit to top 8 results
  }

  getPopularLocations(): DelhiNCRLocation[] {
    // Return most popular locations for quick access
    return DELHI_NCR_LOCATIONS.filter(location => 
      ['metro_station', 'airport', 'mall', 'landmark'].includes(location.type)
    ).slice(0, 6);
  }

  getLocationsByType(type: DelhiNCRLocation['type']): DelhiNCRLocation[] {
    return DELHI_NCR_LOCATIONS.filter(location => location.type === type);
  }

  getLocationByCoordinates(latitude: number, longitude: number): DelhiNCRLocation | null {
    // Find the closest location within 1km radius
    const threshold = 0.01; // Approximately 1km
    
    return DELHI_NCR_LOCATIONS.find(location => {
      const latDiff = Math.abs(location.coordinates.latitude - latitude);
      const lngDiff = Math.abs(location.coordinates.longitude - longitude);
      return latDiff < threshold && lngDiff < threshold;
    }) || null;
  }

  formatLocationDisplay(location: DelhiNCRLocation): string {
    return `${location.name}, ${location.area}, ${location.city}`;
  }

  // Get Delhi NCR bounds for map centering
  getDelhiNCRBounds() {
    return {
      north: 28.8,
      south: 28.3,
      east: 77.5,
      west: 76.8,
      center: {
        latitude: 28.6139,
        longitude: 77.2090
      }
    };
  }
}

export default new DelhiNCRLocationService();
export type { DelhiNCRLocation };
