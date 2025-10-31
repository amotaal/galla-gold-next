// server/auth/session.ts
// ============================================================================
// FIXED - Server-Side Session Utilities
// ============================================================================
// Purpose: Helper functions for session management and role-based access control
// ✅ FIXED: All session.user property access errors

import { auth } from "@/server/auth/config";
import type { Session } from "next-auth";
import type { UserRole, KYCStatus } from "@/types";

// =============================================================================
// SESSION RETRIEVAL
// =============================================================================

/**
 * Get current user session (server-side)
 * @returns Session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get current user session or throw error
 * @throws Error if not authenticated
 * @returns Session
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in");
  }
  
  return session;
}

/**
 * Get current user ID
 * @returns User ID or null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Get current user ID or throw error
 * @throws Error if not authenticated
 * @returns User ID
 */
export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL
// =============================================================================

/**
 * Check if current user has specific role
 * ✅ FIXED: Access session.user.role correctly
 * @param role - Required role
 * @returns true if user has role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  // ✅ FIX: session.user.role is defined in types/next-auth.d.ts
  return session.user.role === role;
}

/**
 * Require specific role or throw error
 * ✅ FIXED: Access session.user.role correctly
 * @param role - Required role
 * @throws Error if user doesn't have role
 */
export async function requireRole(role: UserRole): Promise<void> {
  const session = await requireSession();
  
  // ✅ FIX: session.user.role is defined in types/next-auth.d.ts
  if (session.user.role !== role) {
    throw new Error(`Forbidden: ${role} role required`);
  }
}

/**
 * Check if current user is admin
 * ✅ FIXED: Access session.user.role correctly
 * @returns true if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return await hasRole("admin");
}

/**
 * Require admin role or throw error
 * @throws Error if user is not admin
 */
export async function requireAdmin(): Promise<void> {
  await requireRole("admin");
}

// =============================================================================
// KYC VERIFICATION CHECKS
// =============================================================================

/**
 * Check if current user has completed KYC
 * ✅ FIXED: Access session.user.kycStatus correctly
 * @returns true if KYC is verified
 */
export async function isKYCVerified(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  // ✅ FIX: session.user.kycStatus is defined in types/next-auth.d.ts
  return session.user.kycStatus === "verified";
}

/**
 * Require KYC verification or throw error
 * ✅ FIXED: Access session.user.kycStatus correctly
 * @throws Error if KYC not verified
 */
export async function requireKYC(): Promise<void> {
  const session = await requireSession();
  
  // ✅ FIX: session.user.kycStatus is defined in types/next-auth.d.ts
  if (session.user.kycStatus !== "verified") {
    throw new Error("KYC verification required");
  }
}

/**
 * Get current user's KYC status
 * ✅ FIXED: Access session.user.kycStatus correctly
 * @returns KYC status or null
 */
export async function getKYCStatus(): Promise<KYCStatus | null> {
  const session = await getSession();
  
  // ✅ FIX: session.user.kycStatus is defined in types/next-auth.d.ts
  return session?.user?.kycStatus || null;
}

// =============================================================================
// MFA CHECKS
// =============================================================================

/**
 * Check if current user has MFA enabled
 * ✅ FIXED: Access session.user.hasMFA correctly
 * @returns true if MFA is enabled
 */
export async function hasMFA(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  // ✅ FIX: session.user.hasMFA is defined in types/next-auth.d.ts
  return session.user.hasMFA || false;
}

/**
 * Require MFA to be enabled or throw error
 * ✅ FIXED: Access session.user.hasMFA correctly
 * @throws Error if MFA not enabled
 */
export async function requireMFA(): Promise<void> {
  const session = await requireSession();
  
  // ✅ FIX: session.user.hasMFA is defined in types/next-auth.d.ts
  if (!session.user.hasMFA) {
    throw new Error("MFA verification required");
  }
}

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================

/**
 * Check if current user has verified email
 * @returns true if email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  // emailVerified is Date | null (truthy if Date, falsy if null)
  return !!session.user.emailVerified;
}

/**
 * Require email verification or throw error
 * @throws Error if email not verified
 */
export async function requireEmailVerified(): Promise<void> {
  const session = await requireSession();
  
  if (!session.user.emailVerified) {
    throw new Error("Email verification required");
  }
}

// =============================================================================
// USER INFORMATION HELPERS
// =============================================================================

/**
 * Get current user's email
 * @returns Email address or null
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.email || null;
}

/**
 * Get current user's full name
 * @returns Full name or null
 */
export async function getUserName(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.name || null;
}

/**
 * Get current user's first name
 * @returns First name or null
 */
export async function getUserFirstName(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.firstName || null;
}

/**
 * Get current user's last name
 * @returns Last name or null
 */
export async function getUserLastName(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.lastName || null;
}

/**
 * Get current user's locale
 * ✅ FIXED: Access session.user.locale correctly
 * @returns Locale string or "en" as default
 */
export async function getUserLocale(): Promise<string> {
  const session = await getSession();
  
  // ✅ FIX: session.user.locale is defined in types/next-auth.d.ts
  return session?.user?.locale || "en";
}

/**
 * Get current user's role
 * ✅ FIXED: Access session.user.role correctly
 * @returns User role or null
 */
export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  
  // ✅ FIX: session.user.role is defined in types/next-auth.d.ts
  return session?.user?.role || null;
}

// =============================================================================
// COMBINED CHECKS
// =============================================================================

/**
 * Check if user is admin
 * ✅ FIXED: Access session.user.role correctly
 * @returns true if user is admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  const session = await getSession();
  
  // ✅ FIX: session.user.role is defined in types/next-auth.d.ts
  return session?.user?.role === "admin";
}

/**
 * Check if user has verified KYC
 * ✅ FIXED: Access session.user.kycStatus correctly
 * @returns true if KYC is verified
 */
export async function checkKYCVerified(): Promise<boolean> {
  const session = await getSession();
  
  // ✅ FIX: session.user.kycStatus is defined in types/next-auth.d.ts
  return session?.user?.kycStatus === "verified";
}

/**
 * Check if user has MFA enabled
 * ✅ FIXED: Access session.user.hasMFA correctly
 * @returns true if MFA is enabled
 */
export async function checkMFAEnabled(): Promise<boolean> {
  const session = await getSession();
  
  // ✅ FIX: session.user.hasMFA is defined in types/next-auth.d.ts
  return session?.user?.hasMFA || false;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Refresh session (trigger session update)
 * Useful after profile updates
 */
export async function refreshSession(): Promise<void> {
  // In Next-Auth v5, session is automatically updated
  // This function is kept for API compatibility
  return;
}

/**
 * Check if request is authenticated
 * @returns true if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

// =============================================================================
// EXPORT ALL HELPERS
// =============================================================================

export default {
  // Session
  getSession,
  requireSession,
  getCurrentUserId,
  requireUserId,
  isAuthenticated,
  
  // Roles
  hasRole,
  requireRole,
  isAdmin,
  requireAdmin,
  checkIsAdmin,
  getUserRole,
  
  // KYC
  isKYCVerified,
  requireKYC,
  getKYCStatus,
  checkKYCVerified,
  
  // MFA
  hasMFA,
  requireMFA,
  checkMFAEnabled,
  
  // Email
  isEmailVerified,
  requireEmailVerified,
  
  // User info
  getUserEmail,
  getUserName,
  getUserFirstName,
  getUserLastName,
  getUserLocale,
  
  // Utility
  refreshSession,
};

// =============================================================================
// USAGE EXAMPLES
// =============================================================================
//
// Server Actions:
// ---------------
// import { requireSession, requireKYC } from "@/server/auth/session";
//
// export async function buyGold() {
//   const session = await requireSession();
//   await requireKYC();
//   
//   // Your logic here
//   console.log("User:", session.user.id);
// }
//
// API Routes:
// -----------
// import { getSession, isAdmin } from "@/server/auth/session";
//
// export async function GET() {
//   const session = await getSession();
//   if (!session) {
//     return new Response("Unauthorized", { status: 401 });
//   }
//   
//   if (await isAdmin()) {
//     // Admin-only logic
//   }
// }
//
