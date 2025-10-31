// /types/next-auth.d.ts
// TypeScript type extensions for Auth.js
// Extends the default User and Session types with custom properties

import "next-auth";
import "next-auth/jwt";

/**
 * Extend the built-in session types
 * Adds custom user properties to the session object
 */
declare module "next-auth" {
  /**
   * Extended User interface
   * Returned from authorize() callback
   */
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin";
    hasMFA: boolean;
    kycStatus: "none" | "pending" | "verified" | "rejected";
    locale: string;
  }

  /**
   * Extended Session interface
   * Returned when calling auth() or getSession()
   */
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "user" | "admin";
      hasMFA: boolean;
      kycStatus: "none" | "pending" | "verified" | "rejected";
      locale: string;
    };
  }
}

/**
 * Extend JWT token types
 * Adds custom properties to the JWT payload
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "user" | "admin";
    hasMFA: boolean;
    kycStatus: "none" | "pending" | "verified" | "rejected";
    locale: string;
  }
}
