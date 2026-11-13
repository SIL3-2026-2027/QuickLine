import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Injecte automatiquement le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quickline_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gestion globale des 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('quickline_token');
      localStorage.removeItem('quickline_user');
      const path = window.location.pathname;
      if (path.startsWith('/agent') || path.startsWith('/admin')) {
        window.location.href = '/agent/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helpers
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('quickline_user') || 'null');
  } catch { return null; }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('quickline_token');
};

export const isAdmin = () => getUser()?.role === 'admin';
export const isAgent = () => getUser()?.role === 'agent';

export const logout = async () => {
  try { await api.post('/auth/logout'); } catch { /* ignore */ }
  localStorage.removeItem('quickline_token');
  localStorage.removeItem('quickline_user');
  localStorage.removeItem('quickline_counter_id');
};

export default api;
