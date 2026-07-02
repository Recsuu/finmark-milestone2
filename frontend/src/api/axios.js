import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Injects JWT strings into headers
api.interceptors.request.use(
  (config) => {
    const userSession = JSON.parse(localStorage.getItem('user') || '{}');
    if (userSession?.token) {
      config.headers.Authorization = `Bearer ${userSession.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentWindowPath = window.location.pathname;
    const hasToken = localStorage.getItem('token');

    const isAuthPage = currentWindowPath === '/login' || currentWindowPath === '/register';
    const isAuthRequest = error.config?.url?.includes('/auth');

    if (error.response && error.response.status === 401) {
      if (!isAuthPage && !isAuthRequest && hasToken) {
        console.warn("Active app session expired. Purging local cache tokens and redirecting.");
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;