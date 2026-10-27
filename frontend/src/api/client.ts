import axios from 'axios';

// In-Memory Token Storage (Zero LocalStorage footprint for XSS immunity)
let inMemoryToken: string | null = null;
let inMemorySuperAdminToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function setSuperAdminToken(token: string | null) {
  inMemorySuperAdminToken = token;
}

export function getSuperAdminToken(): string | null {
  return inMemorySuperAdminToken;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://anp-n2e6.onrender.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach authenticated JWT token strictly from memory
api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/super-admin') && inMemorySuperAdminToken) {
    config.headers.Authorization = `Bearer ${inMemorySuperAdminToken}`;
  } else if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && (error.response?.data?.expired || error.response?.data?.revoked)) {
      if (error.config?.url?.startsWith('/super-admin')) {
        inMemorySuperAdminToken = null;
        sessionStorage.removeItem('anp_super_admin_auth');
        localStorage.removeItem('anp_super_admin_auth');
      } else {
        inMemoryToken = null;
        localStorage.removeItem('anp_admin_auth');
        sessionStorage.removeItem('anp_admin_auth');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
