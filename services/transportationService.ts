import api from './api';

export interface TransportationOption {
  id: string;
  type: 'carpool' | 'metro' | 'taxi' | 'bus' | 'auto' | 'walking';
  estimatedCost: number;
  estimatedTime: number; // in minutes
  estimatedDistance: number; // in km
  confidence: number; // 0-1
  co2Savings?: number;
  trafficLevel: 'low' | 'medium' | 'high';
  description: string;
  icon: string;
  mlInsights?: {
    prediction: string;
    factors: string[];
  };
}

export interface TransportationRequest {
  source: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  requestedTime: string; // ISO string
  passengerCount?: number;
}

export interface TransportationResponse {
  requestId: string;
  options: TransportationOption[];
  mlRecommendation: string;
  estimatedSavings: {
    cost: number;
    time: number;
    co2: number;
  };
}

export interface SelectedTransportResponse {
  transportId: string;
  status: 'searching' | 'matched' | 'confirmed' | 'cancelled';
  carpoolId?: string;
  estimatedMatchTime?: number; // minutes
  message: string;
}

export interface CarpoolStatus {
  transportId: string;
  status: 'searching' | 'matched' | 'confirmed' | 'en_route' | 'completed' | 'cancelled';
  carpoolId?: string;
  driver?: {
    name: string;
    rating: number;
    vehicle: string;
    eta?: string;
  };
  members?: Array<{
    id: string;
    name: string;
    rating: number;
    avatar: string;
    joinedAt: string;
  }>;
  estimatedArrival?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

class TransportationService {
  /**
   * Get transportation options with ML predictions
   */
  async getTransportationOptions(request: TransportationRequest): Promise<TransportationResponse> {
    try {
      const response = await api.post('/transportation/options', request);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get transportation options');
    }
  }

  /**
   * Select a transportation option (triggers matching if carpool)
   */
  async selectTransportationOption(
    requestId: string, 
    optionId: string
  ): Promise<SelectedTransportResponse> {
    try {
      const response = await api.post('/transportation/select', {
        requestId,
        optionId
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to select transportation option');
    }
  }

  /**
   * Get current carpool status for real-time updates
   */
  async getCarpoolStatus(transportId: string): Promise<CarpoolStatus> {
    try {
      const response = await api.get(`/transportation/${transportId}/carpool-status`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get carpool status');
    }
  }

  /**
   * Get route switching suggestions
   */
  async getRouteSuggestions(transportId: string) {
    try {
      const response = await api.get(`/transportation/${transportId}/suggestions`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get route suggestions');
    }
  }

  /**
   * Cancel current transportation request
   */
  async cancelTransportation(transportId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/transportation/${transportId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel transportation');
    }
  }
}

export default new TransportationService();