import api from './api';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Carpool {
  _id: string;
  driver: string;
  startLocation: Location;
  endLocation: Location;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  passengers: string[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarpoolData {
  startLocation: Location;
  endLocation: Location;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
}

export interface RideRequest {
  _id: string;
  passenger: string;
  startLocation: Location;
  endLocation: Location;
  requestedTime: string;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  carpoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRideRequestData {
  source: {
    lat: number;
    lng: number;
    address?: string;
  };
  destination: {
    lat: number;
    lng: number;
    address?: string;
  };
  time: string; // ISO string that will be converted to Date on backend
}

class CarpoolService {
  // Carpool methods
  async createCarpool(data: CreateCarpoolData): Promise<Carpool> {
    try {
      const response = await api.post('/pools', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create carpool');
    }
  }

  async getCarpools(): Promise<Carpool[]> {
    try {
      const response = await api.get('/pools');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch carpools');
    }
  }

  async getCarpool(id: string): Promise<Carpool> {
    try {
      const response = await api.get(`/pools/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch carpool');
    }
  }

  async joinCarpool(id: string): Promise<Carpool> {
    try {
      const response = await api.post(`/pools/${id}/join`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to join carpool');
    }
  }

  async leaveCarpool(id: string): Promise<Carpool> {
    try {
      const response = await api.post(`/pools/${id}/leave`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to leave carpool');
    }
  }

  // Ride request methods
  async createRideRequest(data: CreateRideRequestData): Promise<RideRequest> {
    try {
      const response = await api.post('/ride-requests', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create ride request');
    }
  }

  async getRideRequests(): Promise<RideRequest[]> {
    try {
      const response = await api.get('/ride-requests');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ride requests');
    }
  }

  async getRideRequest(id: string): Promise<RideRequest> {
    try {
      const response = await api.get(`/ride-requests/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ride request');
    }
  }

  async cancelRideRequest(id: string): Promise<RideRequest> {
    try {
      const response = await api.delete(`/ride-requests/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel ride request');
    }
  }
}

export default new CarpoolService();
