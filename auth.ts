// auth.ts
// ============================================================================
// NextAuth.js Main Configuration and Exports - FIXED
// ============================================================================
// Purpose: Export NextAuth handlers, signIn, signOut, and auth functions
// ✅ FIXED: Removed conflicting type declarations (use types/next-auth.d.ts instead)

import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";

// =============================================================================
// NEXTAUTH INSTANCE
// =============================================================================

/**
 * Initialize NextAuth with configuration
 * This creates the auth handlers and utility functions
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

// =============================================================================
// CUSTOM AUTH UTILITIES
// =============================================================================

/**
 * Get current session on the server
 * Use this in Server Components and Server Actions
 *
 * @returns Session object or null
 *
 * @example
 * const session = await auth();
 * if (!session) return redirect('/login');
 */
export { auth as getServerSession };

/**
 * Sign in with credentials
 *
 * @param credentials - Email and password
 * @returns User object or null
 *
 * @example
 * await signInWithCredentials({ email: 'user@example.com', password: 'password' });
 */
export async function signInWithCredentials(credentials: {
  email: string;
  password: string;
}) {
  try {
    const result = await signIn("credentials", {
      ...credentials,
      redirect: false,
    });

    return result;
  } catch (error) {
    console.error("Sign in error:", error);
    return null;
  }
}

/**
 * Sign out current user
 *
 * @param redirectTo - Where to redirect after sign out
 *
 * @example
 * await signOutUser('/');
 */
export async function signOutUser(redirectTo: string = "/") {
  try {
    await signOut({ redirectTo });
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

// =============================================================================
// TYPE DECLARATIONS
// =============================================================================
// ✅ FIXED: Removed conflicting type declarations from here
// All type declarations are now in types/next-auth.d.ts
// This prevents conflicts between auth.ts and types/next-auth.d.ts
