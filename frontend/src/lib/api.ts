
import axios from 'axios';

let authRedirectInProgress = false;

// Railway API URL from the environment variable.
// If it is not configured, use the current website origin.
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

// Create Axios API client
const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle API responses and authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      // KDS pages handle login errors inside the page.
      // Avoid redirecting KDS users to the normal login page.
      const isKdsPath =
        window.location.pathname.startsWith('/kds');

      // Remove expired or invalid authentication data.
      localStorage.removeItem('token');

      if (isKdsPath) {
        return Promise.reject(error);
      }

      // Avoid repeated redirects.
      // Also avoid redirecting when the user is already on the login page.
      const isLoginPage =
        window.location.pathname.includes('/auth/login');

      if (!isLoginPage && !authRedirectInProgress) {
        authRedirectInProgress = true;

        localStorage.removeItem('tenant');

        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;