// /app/api/auth/[...nextauth]/route.ts
// Auth.js catch-all route handler
// Handles all authentication-related API requests

import { handlers } from "@/server/auth/config";

/**
 * Export Auth.js handlers for GET and POST requests
 *
 * This catch-all route handles:
 * - /api/auth/signin - Sign in page and endpoint
 * - /api/auth/signout - Sign out endpoint
 * - /api/auth/session - Get current session
 * - /api/auth/providers - List available providers
 * - /api/auth/csrf - Get CSRF token
 * - /api/auth/callback/* - OAuth callbacks
 *
 * Auth.js automatically handles all these routes
 */
export const { GET, POST } = handlers;
