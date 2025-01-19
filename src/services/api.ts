import axios from 'axios';
import { API_CONFIG } from '../config/api';
import WebApp from '@twa-dev/sdk';

// API Error handling class
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: API_CONFIG.HEADERS
});

// Add request interceptor for setting authorization header
api.interceptors.request.use((config) => {
  // Get initData from WebApp
  const initData = WebApp.initData;
  
  if (!initData) {
    throw new ApiError('WebApp initialization data is missing', 401);
  }

  // Set authorization header
  config.headers.Authorization = `tma ${initData}`;
  return config;
});

// Simplified error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      throw new ApiError(
        error.response.data.error || 'Unknown error',
        error.response.status
      );
    }
    throw new ApiError(error.message || 'Network error', 500);
  }
);

export default api; 