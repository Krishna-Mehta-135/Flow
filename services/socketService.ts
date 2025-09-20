import { io, Socket } from 'socket.io-client';

// Your backend server URL
const SOCKET_SERVER_URL = 'http://10.6.192.157:9898'; // Your backend is running on port 9898

interface UserData {
  userId: string;
  username: string;
  userType: 'driver' | 'passenger' | 'looking';
  location: {
    latitude: number;
    longitude: number;
  };
  destination: string;
}

interface LiveUser {
  socketId: string;
  userId: string;
  username: string;
  userType: 'driver' | 'passenger' | 'looking';
  location: {
    latitude: number;
    longitude: number;
  };
  destination: string;
  rating: number;
  status: 'looking' | 'matched';
  joinedAt: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Socket.IO server');
        this.isConnected = true;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from Socket.IO server');
        this.isConnected = false;
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join the live carpool map
  joinLiveMap(userData: UserData) {
    if (this.socket && this.isConnected) {
      console.log('🚗 Joining live map:', userData.username);
      this.socket.emit('joinLiveMap', userData);
    }
  }

  // Update user location
  updateLocation(location: { latitude: number; longitude: number }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('updateLocation', { location });
    }
  }

  // Send ride request
  sendRideRequest(targetUserId: string, message: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('sendRideRequest', { targetUserId, message });
    }
  }

  // Respond to ride request
  respondToRideRequest(targetSocketId: string, accepted: boolean, message: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('respondToRideRequest', { targetSocketId, accepted, message });
    }
  }

  // Event listeners
  onActiveUsers(callback: (users: LiveUser[]) => void) {
    if (this.socket) {
      this.socket.on('activeUsers', callback);
    }
  }

  onUserJoined(callback: (user: LiveUser) => void) {
    if (this.socket) {
      this.socket.on('userJoined', callback);
    }
  }

  onUserLeft(callback: (data: { socketId: string; userId: string }) => void) {
    if (this.socket) {
      this.socket.on('userLeft', callback);
    }
  }

  onUserLocationUpdate(callback: (data: { socketId: string; userId: string; location: { latitude: number; longitude: number } }) => void) {
    if (this.socket) {
      this.socket.on('userLocationUpdate', callback);
    }
  }

  onRideRequestReceived(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('rideRequestReceived', callback);
    }
  }

  onRideRequestResponse(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('rideRequestResponse', callback);
    }
  }

  onUserStatusUpdate(callback: (data: { users: { socketId: string; status: string }[] }) => void) {
    if (this.socket) {
      this.socket.on('userStatusUpdate', callback);
    }
  }

  // Remove event listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export default new SocketService();
export type { LiveUser, UserData };
