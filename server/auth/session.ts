// server/auth/session.ts
// ============================================================================
// Server-Side Session Utilities - FIXED
// ============================================================================
// Purpose: Helper functions for session management and role-based access control
// ✅ FIXED: Added requireAuth export (alias to requireSession)
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
 * Alias for requireSession (for backward compatibility)
 * ✅ FIXED: Added this export - many action files import requireAuth
 * @throws Error if not authenticated
 * @returns Session
 */
export const requireAuth = requireSession;

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
 * @param role - Role to check
 * @returns true if user has role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  return session.user.role === role;
}

/**
 * Require specific role or throw error
 * @param role - Required role
 * @throws Error if user doesn't have role
 */
export async function requireRole(role: UserRole): Promise<void> {
  const session = await requireSession();
  
  if (session.user.role !== role) {
    throw new Error(`Access denied: ${role} role required`);
  }
}

/**
 * Check if current user is admin
 * @returns true if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("admin");
}

/**
 * Require admin role or throw error
 * @throws Error if not admin
 */
export async function requireAdmin(): Promise<void> {
  return requireRole("admin");
}

/**
 * Check if user is admin (alias)
 * @returns true if user is admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "admin";
}

/**
 * Get current user's role
 * @returns User role or null
 */
export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  return session?.user?.role || null;
}

// =============================================================================
// KYC VERIFICATION
// =============================================================================

/**
 * Check if current user has verified KYC
 * @returns true if KYC is verified
 */
export async function isKYCVerified(): Promise<boolean> {
  const session = await getSession();
  
  return session?.user?.kycStatus === "verified";
}

/**
 * Require verified KYC or throw error
 * @throws Error if KYC not verified
 */
export async function requireKYC(): Promise<void> {
  const session = await requireSession();
  
  if (session.user.kycStatus !== "verified") {
    throw new Error("KYC verification required");
  }
}

/**
 * Get current user's KYC status
 * @returns KYC status or null
 */
export async function getKYCStatus(): Promise<KYCStatus | null> {
  const session = await getSession();
  return session?.user?.kycStatus || null;
}

/**
 * Check if user has verified KYC (alias)
 * @returns true if KYC is verified
 */
export async function checkKYCVerified(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.kycStatus === "verified";
}

// =============================================================================
// MFA CHECKS
// =============================================================================

/**
 * Check if current user has MFA enabled
 * @returns true if MFA is enabled
 */
export async function hasMFA(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;
  
  return session.user.hasMFA || false;
}

/**
 * Require MFA to be enabled or throw error
 * @throws Error if MFA not enabled
 */
export async function requireMFA(): Promise<void> {
  const session = await requireSession();
  
  if (!session.user.hasMFA) {
    throw new Error("MFA verification required");
  }
}

/**
 * Check if user has MFA enabled (alias)
 * @returns true if MFA is enabled
 */
export async function checkMFAEnabled(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.hasMFA || false;
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
 * @returns Locale string or "en" as default
 */
export async function getUserLocale(): Promise<string> {
  const session = await getSession();
  return session?.user?.locale || "en";
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
