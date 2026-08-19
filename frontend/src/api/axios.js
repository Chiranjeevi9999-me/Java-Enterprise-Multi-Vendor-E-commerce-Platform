import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopstack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401/403 errors (session expiration or server restarts)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('shopstack_token');
      localStorage.removeItem('shopstack_user');
      window.location.href = '/login?session_expired=true';
    }
    return Promise.reject(error);
  }
);

export default api;
