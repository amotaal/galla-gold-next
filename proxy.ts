// /proxy.ts
// Next.js Proxy File (formerly middleware.ts) for GALLA.GOLD Application
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

  // 2. Check if locale is in Accept-Language header (basic check for simplicity)
  const acceptedLanguage = request.headers.get('accept-language')?.split(',')[0].substring(0, 2);
  if (acceptedLanguage && LOCALES.includes(acceptedLanguage)) {
    return acceptedLanguage;
  }

  // 3. Default locale
  return DEFAULT_LOCALE;
}

// =============================================================================
// MAIN PROXY HANDLER (formerly middleware)
// =============================================================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // --- 1. INTERNATIONALIZATION ---

  const locale = getLocale(request);
  
  // Set the locale in a cookie for the user, and in headers for server components
  response.cookies.set('NEXT_LOCALE', locale, { 
    path: '/', 
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
  response.headers.set('X-Request-Locale', locale);


  // --- 2. AUTHENTICATION ---

  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    // Provide an empty array for a non-existent cookie name if needed, 
    // to avoid potential errors in older next-auth versions.
  });

  const isAuthenticated = !!token;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  
  // Protection: Redirect non-authenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirection: Redirect authenticated users away from /login and /signup
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

// =============================================================================
// MATCHING CONFIGURATION
// =============================================================================
export const config = {
  // Use `matcher` to specify which paths the proxy should run on
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
