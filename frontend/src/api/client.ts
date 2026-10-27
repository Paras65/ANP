import axios from 'axios';

// In-Memory Token Cache (Backed by storage for seamless tab / page reloads)
let inMemoryToken: string | null = null;
let inMemorySuperAdminToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  const stored = sessionStorage.getItem('anp_admin_token') || localStorage.getItem('anp_admin_token');
  if (stored) {
    inMemoryToken = stored;
    return stored;
  }
  return null;
}

export function setSuperAdminToken(token: string | null) {
  inMemorySuperAdminToken = token;
}

export function getSuperAdminToken(): string | null {
  if (inMemorySuperAdminToken) return inMemorySuperAdminToken;
  const stored = sessionStorage.getItem('anp_super_admin_token') || localStorage.getItem('anp_super_admin_token');
  if (stored) {
    inMemorySuperAdminToken = stored;
    return stored;
  }
  return null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://anp-n2e6.onrender.com/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach authenticated JWT token (memory first, fallback to storage)
api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/super-admin')) {
    const sToken = inMemorySuperAdminToken || sessionStorage.getItem('anp_super_admin_token') || localStorage.getItem('anp_super_admin_token');
    if (sToken) {
      config.headers.Authorization = `Bearer ${sToken}`;
    }
  } else {
    const aToken = inMemoryToken || sessionStorage.getItem('anp_admin_token') || localStorage.getItem('anp_admin_token');
    if (aToken) {
      config.headers.Authorization = `Bearer ${aToken}`;
    }
  }
  return config;
});

// Handle 401 Unauthorized globally: purge stale tokens so client never gets trapped
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.config?.url?.startsWith('/super-admin')) {
        inMemorySuperAdminToken = null;
        sessionStorage.removeItem('anp_super_admin_token');
        localStorage.removeItem('anp_super_admin_token');
        sessionStorage.removeItem('anp_super_admin_auth');
        localStorage.removeItem('anp_super_admin_auth');
      } else {
        inMemoryToken = null;
        sessionStorage.removeItem('anp_admin_token');
        localStorage.removeItem('anp_admin_token');
        sessionStorage.removeItem('anp_admin_auth');
        localStorage.removeItem('anp_admin_auth');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
