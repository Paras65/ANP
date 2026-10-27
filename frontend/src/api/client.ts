import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://anp-n2e6.onrender.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach authenticated JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('anp_admin_token') || sessionStorage.getItem('anp_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

