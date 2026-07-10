const RENDER_API_URL = 'https://onestop-x8qg.onrender.com/api';
const LOCAL_API_URL = '/api';

/**
 * Resolves the API base URL from the current page protocol:
 * - https (production) → Render backend
 * - http (local dev)   → /api (proxied to localhost:3001 by Vite)
 *
 * Override anytime with VITE_API_URL in .env
 */
export function getApiBaseUrl(): string {
  const override = import.meta.env.VITE_API_URL;
  if (override) return override.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return RENDER_API_URL;
  }

  return LOCAL_API_URL;
}
