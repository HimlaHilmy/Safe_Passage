/**
 * Centralized CORS Configuration for Safe Passage API & Socket.IO
 * Supports:
 * - Local development origins (localhost:5173, localhost:3000, 127.0.0.1, etc.)
 * - Configured production client URLs via CLIENT_URL environment variable
 * - Dynamic matching for all Vercel production and preview domains (*.vercel.app)
 * - Server-to-server and non-browser requests (Postman, health checks, curl)
 */

function getCorsOriginChecker() {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
  ];

  // Parse comma-separated origins from CLIENT_URL if provided
  const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedList = new Set([...defaultOrigins, ...configuredOrigins]);

  return (origin, callback) => {
    // 1. Allow non-browser requests with no origin header (curl, mobile, health probes)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // 2. Check explicit allowed list
    if (allowedList.has(cleanOrigin)) {
      return callback(null, true);
    }

    // 3. Automatically allow all Vercel deployment domains (*.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // 4. In development mode, allow any local or testing origin
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // 5. Block disallowed origins in production
    console.warn(`[CORS Blocked] Request from unauthorized origin: ${cleanOrigin}`);
    return callback(new Error(`CORS policy blocked access from origin: ${cleanOrigin}`));
  };
}

const corsOptions = {
  origin: getCorsOriginChecker(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

module.exports = { getCorsOriginChecker, corsOptions };

