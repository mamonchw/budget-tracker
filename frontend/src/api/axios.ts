import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Extremely important to send HTTP-Only cookies (refresh token)
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 Unauthorized, and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept if it's the login or refresh route failing
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh token using the HTTP-Only cookie
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        if (res.data?.success && res.data.data?.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);
          
          // Update the original request with the new token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (e.g., refresh token expired or revoked)
        // We should log the user out by clearing local storage
        localStorage.removeItem('accessToken');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'; // Force redirect to login
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
