/**
 * Centralized API configuration logic to handle production vs development environment.
 */

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('192.168.'));

/**
 * Gets the base URL for API requests.
 * prioritize local backend for local dev, but ALWAYS use /api relative path for production.
 */
export const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use it
  const raw = import.meta.env.VITE_API_URL;
  if (raw) {
    const v = String(raw).trim();
    // Accept relative "/api" as-is
    if (v === '/api' || v.startsWith('/api/')) return v.replace(/\/+$/, '');
    // If someone sets "http(s)://host" without "/api", append it.
    if (/^https?:\/\//i.test(v) && !/\/api\/?$/i.test(v)) return v.replace(/\/+$/, '') + '/api';
    return v.replace(/\/+$/, '');
  }
  
  // Otherwise, detect environment
  return isLocal ? 'http://localhost:5000/api' : '/api';
};

/**
 * Gets the base URL for static file uploads.
 */
export const getUploadBaseUrl = () => {
  // Deduce base from API URL (removing /api)
  return getApiBaseUrl().replace(/\/api\/?$/, '');
};

const apiConfig = {
  isLocal,
  getApiBaseUrl,
  getUploadBaseUrl
};

export default apiConfig;
