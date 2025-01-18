export const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_SECONDLANE_API_URL}/api/v1`,
  IMAGE_BASE_URL: import.meta.env.VITE_SECONDLANE_API_URL,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}; 