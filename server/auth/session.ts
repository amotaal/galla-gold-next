// server/auth/session.ts
// Purpose: Server-Side Session Utilities with FIXED requireKYC to return Session

import { auth } from "@/server/auth/config";
import type { Session } from "next-auth";
import type { UserRole, KYCStatus } from "@/types";

// =============================================================================
// SESSION RETRIEVAL
// =============================================================================

export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in");
  }

  return session;
}

export const requireAuth = requireSession;

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}

// =============================================================================
// ROLE-BASED ACCESS CONTROL
// =============================================================================

export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  return session.user.role === role;
}

export async function requireRole(role: UserRole): Promise<void> {
  const session = await requireSession();

  if (session.user.role !== role) {
    throw new Error(`Access denied: ${role} role required`);
  }
}

export async function isAdmin(): Promise<boolean> {
  return hasRole("admin");
}

export async function requireAdmin(): Promise<void> {
  return requireRole("admin");
}

export async function checkIsAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "admin";
}

export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  return session?.user?.role || null;
}

// =============================================================================
// KYC VERIFICATION
// =============================================================================

export async function isKYCVerified(): Promise<boolean> {
  const session = await getSession();

  return session?.user?.kycStatus === "verified";
}

/**
 * ✅ FIXED: Now returns Session instead of void
 * Require verified KYC or throw error
 * @throws Error if KYC not verified
 * @returns Session with verified KYC user
 */
export async function requireKYC(): Promise<Session> {
  const session = await requireSession();

  if (session.user.kycStatus !== "verified") {
    throw new Error("KYC verification required");
  }

  return session; // ✅ FIXED: Return the session
}

export async function getKYCStatus(): Promise<KYCStatus | null> {
  const session = await getSession();
  return session?.user?.kycStatus || null;
}

export async function checkKYCVerified(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.kycStatus === "verified";
}

// =============================================================================
// MFA CHECKS
// =============================================================================

export async function hasMFA(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  return session.user.hasMFA || false;
}

export async function requireMFA(): Promise<void> {
  const session = await requireSession();

  if (!session.user.hasMFA) {
    throw new Error("MFA verification required");
  }
}

export async function checkMFAEnabled(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.hasMFA || false;
}

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================

export async function isEmailVerified(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  return !!session.user.emailVerified;
}

export async function requireEmailVerified(): Promise<void> {
  const session = await requireSession();

  if (!session.user.emailVerified) {
    throw new Error("Email verification required");
  }
}

// =============================================================================
// USER INFORMATION HELPERS
// =============================================================================

export async function getUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.email || null;
}

export async function getUserName(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.name || null;
}

export async function getUserFirstName(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.firstName || null;
}

export async function getUserLastName(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.lastName || null;
}

export async function getUserLocale(): Promise<string> {
  const session = await getSession();
  return session?.user?.locale || "en";
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export async function refreshSession(): Promise<void> {
  // In Next-Auth v5, session is automatically updated
  // This function is kept for API compatibility
  return;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

// =============================================================================
// ADMIN ROLE CHECKING
// =============================================================================

export async function isOperator(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "operator";
}

export async function requireOperator(): Promise<Session> {
  const session = await requireSession();
  if (!["operator", "admin", "superadmin"].includes(session.user.role)) {
    throw new Error("Operator access required");
  }
  return session;
}

export async function isSuperAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "superadmin";
}

export async function isAuditor(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === "auditor";
}

/**
 * Check if user has admin access (any admin role)
 */
export async function hasAdminAccess(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.user?.role) return false;

    const adminRoles = ["operator", "admin", "superadmin", "auditor"];
    return adminRoles.includes(session.user.role);
  } catch {
    return false;
  }
}

/**
 * Require superadmin role or throw
 */
export async function requireSuperAdmin() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  if (session.user.role !== "superadmin") {
    throw new Error("Super admin access required");
  }

  return session;
}
