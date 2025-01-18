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
  headers: {
    ...API_CONFIG.HEADERS,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  // Add withCredentials if your API requires cookies/auth to be passed
  withCredentials: false,
  // Ensure OPTIONS requests are handled
  validateStatus: (status) => {
    return status >= 200 && status < 500; // Handle all status codes except server errors
  }
});

// Add request interceptor for setting authorization header
api.interceptors.request.use((config) => {
  console.log('API Interceptor: Starting request:', {
    url: config.url,
    method: config.method,
    params: config.params,
    baseURL: config.baseURL
  });

  // Check WebApp status
  console.log('API Interceptor: WebApp state:', {
    isInitialized: !!window.Telegram?.WebApp,
    isExpanded: window.Telegram?.WebApp?.isExpanded,
    version: window.Telegram?.WebApp?.version,
    platform: window.Telegram?.WebApp?.platform,
    initData: WebApp.initData?.substring(0, 50),
    initDataUnsafe: {
      ...WebApp.initDataUnsafe,
      user: WebApp.initDataUnsafe?.user ? {
        id: WebApp.initDataUnsafe.user.id,
        username: WebApp.initDataUnsafe.user.username
      } : null
    }
  });

  // Get initData from WebApp
  const initData = WebApp.initData;
  
  if (!initData) {
    console.error('API Interceptor: No initData available');
    throw new ApiError('WebApp initialization data is missing', 401);
  }

  // Set authorization header
  config.headers.Authorization = `tma ${initData}`;
  
  // Add more detailed logging
  console.log('API Interceptor: Full request config:', {
    url: config.url,
    method: config.method,
    baseURL: config.baseURL,
    headers: {
      ...config.headers,
      Authorization: 'tma ' + initData.substring(0, 20) + '...' // Log partial token for debugging
    },
    withCredentials: config.withCredentials
  });

  return config;
}, (error) => {
  console.error('API Interceptor: Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log('Full server response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        url: response.config.url,
        method: response.config.method,
        headers: response.config.headers
      }
    });

    // Check for error in response data
    if (response.data?.error) {
      console.error('Error in response:', {
        url: response.config.url,
        status: response.status,
        error: response.data.error,
        fullData: response.data
      });
      throw new ApiError(response.data.error, response.status);
    }

    console.log('Successful response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Request error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      error: error.message
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