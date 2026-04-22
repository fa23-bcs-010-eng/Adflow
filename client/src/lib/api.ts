import axios from 'axios';

// Always use local Next.js API routes from the browser.
// Server-side proxying to external services is handled by /api/[...path] route.
const baseURL = '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on each request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ag_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ag_token');
      localStorage.removeItem('ag_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export default api;
