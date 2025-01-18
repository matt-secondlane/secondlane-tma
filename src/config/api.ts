export const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_SECONDLANE_API_URL}/api/v1`,
  IMAGE_BASE_URL: import.meta.env.VITE_SECONDLANE_API_URL,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  }
}; 