import api from './api';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  timestamp: number;
  services?: {
    database: 'connected' | 'disconnected';
    api: 'running' | 'down';
  };
}

export const healthService = {
  // Check if backend is reachable
  checkHealth: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await api.get('/health');
      return {
        status: 'ok',
        message: 'Backend is reachable',
        timestamp: Date.now(),
        services: response.data.services,
      };
    } catch (error: any) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        message: error.message || 'Backend is not reachable',
        timestamp: Date.now(),
      };
    }
  },

  // Simple connectivity test
  ping: async (): Promise<boolean> => {
    try {
      await api.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('Ping failed:', error);
      return false;
    }
  },
};

export default healthService;