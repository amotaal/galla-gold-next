// components/providers/auth.tsx
// Purpose: Authentication Provider with FIXED session user types

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// ✅ FIXED: Import Session type to get extended user properties
import type { Session } from "next-auth";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * User type matching the Auth.js session user
 * ✅ FIXED: This now matches the extended Session.user from types/next-auth.d.ts
 */
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  kycStatus: "none" | "pending" | "submitted" | "verified" | "rejected";
  mfaEnabled: boolean;
  avatar?: string;
  phone?: string;
}

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Utility functions
  refetch: () => void;

  // Status checks
  hasVerifiedEmail: boolean;
  hasKYC: boolean;
  hasMFA: boolean;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

/**
 * AuthProvider - Wraps the app and provides authentication state
 *
 * This provider uses Auth.js (NextAuth) session under the hood.
 * It transforms the session data into a user-friendly format.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Get session from Auth.js
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Local state
  const [isReady, setIsReady] = useState(false);

  // Determine loading state
  const isLoading = status === "loading" || !isReady;

  // ✅ FIXED: Properly type session to get extended user properties
  const sessionUser = (session as Session)?.user;

  // Transform session into user object
  const user: User | null = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        // ✅ FIXED: These properties now exist because of types/next-auth.d.ts
        firstName: sessionUser.firstName,
        lastName: sessionUser.lastName,
        emailVerified: !!sessionUser.emailVerified,
        kycStatus: sessionUser.kycStatus || "none",
        mfaEnabled: sessionUser.mfaEnabled || false,
        avatar: sessionUser.avatar,
        phone: sessionUser.phone,
      }
    : null;

  // Status checks
  const hasVerifiedEmail = user?.emailVerified || false;
  const hasKYC = user?.kycStatus === "verified";
  const hasMFA = user?.mfaEnabled || false;

  // Mark as ready after initial load
  useEffect(() => {
    if (status !== "loading") {
      setIsReady(true);
    }
  }, [status]);

  // Refetch function
  const refetch = () => {
    update();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
    hasVerifiedEmail,
    hasKYC,
    hasMFA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * useAuth - Access authentication state anywhere in the app
 *
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType
 *
 * Usage:
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <LoginPrompt />;
 *
 * return <div>Hello {user.firstName}!</div>;
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * useRequireAuth - Redirect to login if not authenticated
 *
 * Usage:
 * ```tsx
 * const user = useRequireAuth();
 * ```
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  return user;
}

/**
 * useRequireKYC - Redirect to KYC page if not verified
 */
export function useRequireKYC() {
  const { user, isLoading, hasKYC } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !hasKYC) {
      router.push("/kyc");
    }
  }, [user, isLoading, hasKYC, router]);

  return user;
}

/**
 * useRequireEmailVerified - Redirect if email not verified
 */
export function useRequireEmailVerified() {
  const { user, isLoading, hasVerifiedEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !hasVerifiedEmail) {
      router.push("/verify-email");
    }
  }, [user, isLoading, hasVerifiedEmail, router]);

  return user;
}
