// /middleware.ts
// Next.js Middleware for GALLA.GOLD Application
// Purpose: Handle authentication protection and internationalization (i18n) before requests reach pages
// Middleware runs on the Edge Runtime for optimal performance

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Supported locales for the application
const LOCALES = ['en', 'es', 'fr', 'ru', 'ar'];
const DEFAULT_LOCALE = 'en';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard'];

// Routes that redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/signup'];

// Public routes that don't need authentication
const PUBLIC_ROUTES = ['/', '/verify', '/reset', '/magic'];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the preferred locale from various sources
 * Priority: Cookie > Browser Header > Default
 */
function getLocale(request: NextRequest): string {
  // 1. Check if locale is stored in cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeCookie && LOCALES.includes(localeCookie)) {
    return localeCookie;
  }

  // 2. Check Accept-Language header from browser
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse accept-language header (e.g., "en-US,en;q=0.9,es;q=0.8")
    const browserLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    if (LOCALES.includes(browserLang)) {
      return browserLang;
    }
  }

  // 3. Fall back to default locale
  return DEFAULT_LOCALE;
}

/**
 * Check if a route is protected (requires authentication)
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is an auth route (login, signup, etc.)
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is public (accessible without auth)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

// =============================================================================
// MAIN MIDDLEWARE FUNCTION
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // =============================================================================
  // LOCALE HANDLING
  // =============================================================================
  
  const locale = getLocale(request);
  const response = NextResponse.next();

  // Set locale cookie for future requests (expires in 1 year)
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
  });

  // Add locale to request headers for server components to access
  response.headers.set('x-locale', locale);

  // =============================================================================
  // AUTHENTICATION HANDLING
  // =============================================================================

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Handle protected routes (require authentication)
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // User is authenticated, allow access
    return response;
  }

  // Handle auth routes (redirect to dashboard if already authenticated)
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      // User is already logged in, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // User is not authenticated, allow access to auth pages
    return response;
  }

  // Handle public routes (accessible to all)
  if (isPublicRoute(pathname)) {
    return response;
  }

  // For any other routes, allow access
  return response;
}

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Matcher configuration tells Next.js which routes to run middleware on
 * We exclude static files, images, and API routes for performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /_static/ (static files)
     * 4. /_vercel/ (Vercel internals)
     * 5. Static files (images, fonts, etc.)
     */
    '/((?!api|_next|_static|_vercel|.*\\..*).*)',
  ],
};

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================
/*
 * This middleware handles two main concerns:
 * 
 * 1. INTERNATIONALIZATION (i18n):
 *    - Detects user's preferred language from cookie, browser, or defaults to English
 *    - Sets locale cookie for persistence across sessions
 *    - Makes locale available to server components via headers
 * 
 * 2. AUTHENTICATION:
 *    - Protects /dashboard/* routes (requires login)
 *    - Redirects authenticated users away from /login and /signup
 *    - Allows public access to homepage, verification, and reset pages
 * 
 * PERFORMANCE NOTES:
 * - Runs on Edge Runtime (faster than Node.js runtime)
 * - Executes before every request (keep logic simple and fast)
 * - Uses minimal dependencies (next-auth/jwt only)
 * 
 * DEBUGGING:
 * - Check middleware logs in deployment platform (Vercel, etc.)
 * - Test with different Accept-Language headers
 * - Clear cookies to test locale detection
 * 
 * FUTURE ENHANCEMENTS:
 * - Add rate limiting for auth routes
 * - Implement geolocation-based locale detection
 * - Add role-based access control (RBAC)
 */
