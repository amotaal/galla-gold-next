// types/next-auth.d.ts
// FINAL FIXED VERSION - emailVerified is Date | null as per Next-Auth spec

import "next-auth";
import "next-auth/jwt";

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
    emailVerified: Date | null;  // FIXED: Must be Date | null, not boolean
  }

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
      emailVerified: Date | null;  // FIXED: Must be Date | null, not boolean
      mfaEnabled: boolean;
      avatar?: string;
      phone?: string;
    };
  }
}

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
    emailVerified: Date | null;  // FIXED: Must be Date | null, not boolean
  }
}
