/**
 * Safe Passage Centralized API & Socket.IO Configuration
 *
 * In local development: defaults to http://localhost:5000/api and http://localhost:5000
 * In Vercel Services deployment (unified domain): defaults to /api and window.location.origin
 * In custom deployment: reads VITE_API_URL and VITE_SOCKET_URL from environment variables
 */

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const rawSocketUrl = (import.meta.env.VITE_SOCKET_URL || '').trim();

// In production on Vercel Services, relative '/api' routes directly to the backend service
const defaultApi = (typeof window !== 'undefined' && !import.meta.env.DEV)
  ? '/api'
  : 'http://localhost:5000/api';

const normalizedApi = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`).replace(/\/+$/, '')
  : defaultApi;

export const API_BASE_URL = normalizedApi;

// Base Socket URL (e.g. window.location.origin or http://localhost:5000)
// If VITE_SOCKET_URL is omitted, automatically derives from API_BASE_URL or window.location.origin
export const SOCKET_BASE_URL = rawSocketUrl
  ? rawSocketUrl.replace(/\/+$/, '')
  : API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api\/?$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export const getApiUrl = () => API_BASE_URL;
export const getSocketUrl = () => SOCKET_BASE_URL;

// Diagnostic log in browser console for deployment debugging
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  console.log(`[Safe Passage Config] API Base: ${API_BASE_URL} | Socket Base: ${SOCKET_BASE_URL}`);
}

export default {
  API_BASE_URL,
  SOCKET_BASE_URL,
  getApiUrl,
  getSocketUrl,
};
