import axios from 'axios';
import { showToast } from './toast';

// Use relative URL so Vite proxy directs to http://localhost:8080/api
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fm_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response ? error.response.status : null;
    const data = error.response ? error.response.data : null;
    const message = data?.message || error.message || 'An unexpected error occurred';

    if (status === 401 && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
      localStorage.removeItem('fm_token');
      localStorage.removeItem('fm_user');
      showToast('Your session has expired. Please log in again.', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

