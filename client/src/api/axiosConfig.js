import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api' 
      : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 10) + '...' : 'NONE',
        localStorageToken: localStorage.getItem('token') ? 'FOUND' : 'MISSING'
      });
    }
    // Let the browser set multipart boundary — default JSON Content-Type breaks FormData + multer
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
          config.headers.delete('content-type');
        } else {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        console.warn('⚠️ 401 Unauthorized detected. Removing invalid token.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;