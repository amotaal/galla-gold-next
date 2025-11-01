// /server/auth/config.ts
// ============================================================================
// FIXED - Next-Auth v5 Configuration for GALLA.GOLD ALTERNATIVE LOCATION
// ============================================================================
// Purpose: Main authentication configuration with Credentials provider
// ✅ FIXED: Proper typing for credentials and authorized callback
// ✅ FIXED: Converts boolean emailVerified → Date | null for Next-Auth
// ✅ FIXED: Allows login without email verification (users redirected to verify page after login)

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import { verifyPassword } from "@/server/lib/crypto";
import type { User as AuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// =============================================================================
// NEXT-AUTH CONFIGURATION
// =============================================================================

export const authConfig: NextAuthConfig = {
  // ---------------------------------------------------------------------------
  // PROVIDERS
  // ---------------------------------------------------------------------------
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // -----------------------------------------------------------------------
      // AUTHORIZE FUNCTION
      // -----------------------------------------------------------------------
      // ✅ FIXED: Properly typed credentials, converts emailVerified boolean → Date | null
      // ✅ FIXED: Allows login without email verification
      async authorize(credentials): Promise<AuthUser | null> {
        try {
          // ✅ FIX: Type assertion for credentials
          const { email, password } = credentials as {
            email: string;
            password: string;
          };

          if (!email || !password) {
            throw new Error("Missing credentials");
          }

          // Connect to database
          await connectDB();

          // Find user with password field
          const user = await User.findOne({
            email: email.toLowerCase(),
          }).select("+password");

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Check if account is locked
          if (user.lockUntil && user.lockUntil > new Date()) {
            throw new Error("Account is locked. Please try again later.");
          }

          // Verify password (by comparing both passwords not to be confused with verify email)
          // Verify password
          console.log("🔐 [AUTH DEBUG] Attempting password verification...");
          console.log("🔐 [AUTH DEBUG] Email:", email);
          console.log(
            "🔐 [AUTH DEBUG] Password received (length):",
            password?.length
          );
          console.log(
            "🔐 [AUTH DEBUG] Hash from DB:",
            user.password?.substring(0, 20) + "..."
          );

          const isValid = await user.comparePassword(password);

          console.log("🔐 [AUTH DEBUG] Password verification result:", isValid);

          if (!isValid) {
            // Increment failed login attempts
            await user.incrementLoginAttempts();
            console.log("❌ [AUTH DEBUG] Password verification FAILED");
            throw new Error("Invalid credentials");
          }

          console.log("✅ [AUTH DEBUG] Password verification SUCCESS");

          // ✅ FIXED: Removed email verification check to allow login
          // Users will be redirected to verify-email page after login if not verified
          // This prevents the deadlock where users can't login to verify their email

          // NOTE: If you want to enforce email verification before login in production,
          // uncomment the following code:
          /*
          if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in");
          }
          */

          // Reset failed login attempts on successful login
          await user.resetLoginAttempts();

          // Update last login
          user.lastLoginAt = new Date();
          await user.save();

          // ✅ CRITICAL FIX: Convert boolean → Date | null for Next-Auth
          // User model has: emailVerified: boolean
          // Next-Auth needs: emailVerified: Date | null
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            hasMFA: user.mfaEnabled,
            kycStatus: user.kycStatus,
            locale: user.locale || "en",
            emailVerified: user.emailVerified ? new Date() : null, // ✅ CONVERSION
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          // Return null to indicate authentication failure
          // The error message will be passed to the client
          return null;
        }
      },
    }),
  ],

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------
  callbacks: {
    // -------------------------------------------------------------------------
    // JWT CALLBACK
    // -------------------------------------------------------------------------
    // ✅ FIXED: Preserves emailVerified as Date | null in token
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: AuthUser;
      trigger?: "signIn" | "signUp" | "update";
      session?: any;
    }): Promise<JWT> {
      // On sign in, add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.hasMFA = user.hasMFA;
        token.kycStatus = user.kycStatus;
        token.locale = user.locale;
        token.emailVerified = user.emailVerified; // ✅ Already Date | null
      }

      // Handle session updates (e.g., profile changes)
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.firstName = session.firstName || token.firstName;
        token.lastName = session.lastName || token.lastName;
        token.locale = session.locale || token.locale;
      }

      return token;
    },

    // -------------------------------------------------------------------------
    // SESSION CALLBACK
    // -------------------------------------------------------------------------
    // ✅ FIXED: Passes emailVerified as Date | null to session
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as "user" | "admin",
          hasMFA: token.hasMFA as boolean,
          mfaEnabled: token.hasMFA as boolean, // Alias
          kycStatus: token.kycStatus as any,
          locale: token.locale as string,
          emailVerified: token.emailVerified as Date | null, // ✅ Keep as Date | null
        };
      }

      return session;
    },

    // -------------------------------------------------------------------------
    // AUTHORIZED CALLBACK (for middleware)
    // -------------------------------------------------------------------------
    // ✅ FIXED: Properly typed parameters
    async authorized({
      auth,
      request,
    }: {
      auth: Session | null;
      request: Request & { nextUrl: URL };
    }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // Public routes (accessible without auth)
      const publicRoutes = [
        "/",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ];

      // Check if current route is public
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
      );

      // Allow access to public routes
      if (isPublicRoute) {
        return true;
      }

      // Require authentication for all other routes
      return isLoggedIn;
    },
  },

  // ---------------------------------------------------------------------------
  // PAGES
  // ---------------------------------------------------------------------------
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },

  // ---------------------------------------------------------------------------
  // SESSION
  // ---------------------------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ---------------------------------------------------------------------------
  // JWT
  // ---------------------------------------------------------------------------
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ---------------------------------------------------------------------------
  // SECURITY
  // ---------------------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // ---------------------------------------------------------------------------
  // DEBUG (disable in production)
  // ---------------------------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
};

// =============================================================================
// EXPORT NEXTAUTH INSTANCE
// =============================================================================

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
