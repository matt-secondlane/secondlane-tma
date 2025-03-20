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

// Add request interceptor for setting authorization header and logging
api.interceptors.request.use((config) => {
  // Get initData from WebApp
  const initData = WebApp.initData;
  
  if (!initData) {
    throw new ApiError('WebApp initialization data is missing', 401);
  }

  // Set authorization header
  config.headers.Authorization = `tma ${initData}`;
  
  // Log request
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    params: config.params,
    data: config.data,
    headers: config.headers
  });
  
  return config;
});

// Simplified error handling with logging
api.interceptors.response.use(
  response => {
    // Log successful response
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  error => {
    // Log error response
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
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