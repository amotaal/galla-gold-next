// types/next-auth.d.ts
// Next-Auth Type Definitions for GALLA.GOLD
// Purpose: Extend Next-Auth types with custom user properties
// CRITICAL FIX: emailVerified MUST be Date | null (Next-Auth v5 spec), NOT boolean

import "next-auth";
import "next-auth/jwt";

// =============================================================================
// NEXT-AUTH USER TYPE EXTENSION
// =============================================================================

/**
 * Extends the default Next-Auth User type
 * This type is returned by the authorize() callback
 * 
 * CRITICAL: emailVerified must be Date | null to match Next-Auth v5 spec
 * Our database stores it as boolean, so we convert in auth callbacks
 */
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin";
    hasMFA: boolean;
    kycStatus: "none" | "pending" | "submitted" | "verified" | "rejected";
    locale: string;
    emailVerified: Date | null;  // ⚠️ MUST be Date | null, not boolean
  }

  /**
   * Extends the Session type
   * This is what's available in useSession() and auth()
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      role: "user" | "admin";
      hasMFA: boolean;
      kycStatus: "none" | "pending" | "submitted" | "verified" | "rejected";
      locale: string;
      emailVerified: Date | null;  // ⚠️ MUST be Date | null, not boolean
      
      // Additional session properties
      mfaEnabled: boolean;
      avatar?: string;
      phone?: string;
    };
  }
}

// =============================================================================
// JWT TYPE EXTENSION
// =============================================================================

/**
 * Extends the JWT type
 * This is stored in the session token
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin";
    hasMFA: boolean;
    kycStatus: "none" | "pending" | "submitted" | "verified" | "rejected";
    locale: string;
    emailVerified: Date | null;  // ⚠️ MUST be Date | null, not boolean
  }
}

// =============================================================================
// USAGE NOTES
// =============================================================================

/*
 * WHY emailVerified IS Date | null:
 * 
 * Next-Auth v5 standardized emailVerified to be Date | null to match
 * the OAuth providers' behavior (Google, Facebook, etc. return dates).
 * 
 * However, our User model stores it as boolean for simplicity.
 * 
 * CONVERSION STRATEGY:
 * - In authorize() callback: Convert boolean → Date | null
 *   user.emailVerified ? new Date() : null
 * 
 * - In components: Convert Date | null → boolean
 *   !!session?.user?.emailVerified
 * 
 * 
 * EXAMPLE AUTH CALLBACK:
 * 
 * async authorize(credentials) {
 *   const user = await User.findOne({ email });
 *   
 *   return {
 *     id: String(user._id),
 *     email: user.email,
 *     name: `${user.firstName} ${user.lastName}`,
 *     firstName: user.firstName,
 *     lastName: user.lastName,
 *     role: user.role,
 *     hasMFA: user.mfaEnabled,
 *     kycStatus: user.kycStatus,
 *     locale: user.locale || "en",
 *     emailVerified: user.emailVerified ? new Date() : null, // ← CONVERSION
 *   };
 * }
 * 
 * 
 * EXAMPLE COMPONENT USAGE:
 * 
 * const { data: session } = useSession();
 * const isEmailVerified = !!session?.user?.emailVerified; // ← Convert to boolean
 */
