/**
 * Safe Passage Centralized API & Socket.IO Configuration
 *
 * In local development: defaults to http://localhost:5000/api and http://localhost:5000
 * In production: reads VITE_API_URL and VITE_SOCKET_URL from environment variables
 */

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;

// Base API URL (e.g. 'https://safe-passage-api.onrender.com/api' or 'http://localhost:5000/api')
export const API_BASE_URL = (rawApiUrl || 'http://localhost:5000/api').replace(/\/+$/, '');

// Base Socket URL (e.g. 'https://safe-passage-api.onrender.com' or 'http://localhost:5000')
export const SOCKET_BASE_URL = (rawSocketUrl || 'http://localhost:5000').replace(/\/+$/, '');

export const getApiUrl = () => API_BASE_URL;
export const getSocketUrl = () => SOCKET_BASE_URL;

// Diagnostic warning in browser console if production build is missing live backend URL
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  if (!rawApiUrl || rawApiUrl.includes('localhost')) {
    console.warn(
      '[Safe Passage Config Warning] VITE_API_URL is missing or pointing to localhost in this production build.\n' +
      'Please configure VITE_API_URL in your Vercel Project Settings (Settings -> Environment Variables) ' +
      'to point to your live backend (e.g. https://your-backend.onrender.com/api).'
    );
  }
}

export default {
  API_BASE_URL,
  SOCKET_BASE_URL,
  getApiUrl,
  getSocketUrl,
};

