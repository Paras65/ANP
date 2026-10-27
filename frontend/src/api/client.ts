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

// Handle 401 Unauthorized globally (e.g. expired or revoked token after PIN change)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && (error.response?.data?.expired || error.response?.data?.revoked)) {
      localStorage.removeItem('anp_admin_auth');
      sessionStorage.removeItem('anp_admin_auth');
      localStorage.removeItem('anp_admin_token');
      sessionStorage.removeItem('anp_admin_token');
    }
    return Promise.reject(error);
  }
);

export default api;

