// auth.config.ts
// ============================================================================
// FIXED - Next-Auth v5 Configuration for GALLA.GOLD
// ============================================================================
// Purpose: Main authentication configuration with Credentials provider
// CRITICAL FIX: Properly converts emailVerified between boolean and Date | null

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import { verifyPassword } from "@/server/lib/crypto";
import type { User as AuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// =============================================================================
// NEXT-AUTH CONFIGURATION
// =============================================================================

export const authConfig = {
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
      // ✅ FIXED: Converts boolean emailVerified → Date | null for Next-Auth
      async authorize(credentials): Promise<AuthUser | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Missing credentials");
          }

          // Connect to database
          await connectDB();

          // Find user with password field
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }).select("+password");

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Check if account is locked
          if (user.lockUntil && user.lockUntil > new Date()) {
            throw new Error("Account is locked. Please try again later.");
          }

          // Verify password
          const isValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            // Increment failed login attempts
            await user.incrementLoginAttempts();
            throw new Error("Invalid credentials");
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in");
          }

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
            emailVerified: user.emailVerified ? new Date() : null,  // ✅ CONVERSION
          };
        } catch (error: any) {
          console.error("Auth error:", error);
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
    async jwt({ token, user, trigger, session }: {
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
        token.emailVerified = user.emailVerified;  // ✅ Already Date | null
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
    async session({ session, token }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          firstName: token.firstName,
          lastName: token.lastName,
          role: token.role,
          hasMFA: token.hasMFA,
          mfaEnabled: token.hasMFA,  // Alias
          kycStatus: token.kycStatus,
          locale: token.locale,
          emailVerified: token.emailVerified as Date | null,  // ✅ Keep as Date | null
        };
      }

      return session;
    },

    // -------------------------------------------------------------------------
    // AUTHORIZED CALLBACK (for middleware)
    // -------------------------------------------------------------------------
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // Public routes
      const publicRoutes = ["/", "/login", "/signup", "/verify-email", "/reset-password"];
      const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/auth");

      // Allow public routes
      if (isPublicRoute) {
        return true;
      }

      // Protect all other routes
      return isLoggedIn;
    },
  },

  // ---------------------------------------------------------------------------
  // PAGES
  // ---------------------------------------------------------------------------
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/dashboard",  // Redirect after signup
  },

  // ---------------------------------------------------------------------------
  // SESSION CONFIGURATION
  // ---------------------------------------------------------------------------
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // Update every 24 hours
  },

  // ---------------------------------------------------------------------------
  // JWT CONFIGURATION
  // ---------------------------------------------------------------------------
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ---------------------------------------------------------------------------
  // SECURITY OPTIONS
  // ---------------------------------------------------------------------------
  trustHost: true,  // For deployment
  secret: process.env.NEXTAUTH_SECRET,

  // ---------------------------------------------------------------------------
  // DEBUG (disable in production)
  // ---------------------------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
};

// =============================================================================
// EXPORT HANDLERS
// =============================================================================

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// =============================================================================
// NOTES
// =============================================================================
//
// emailVerified Conversion Flow:
// ------------------------------
// 1. User Model (MongoDB):     emailVerified: boolean
// 2. authorize() returns:      emailVerified: Date | null  (CONVERTED)
// 3. JWT token stores:         emailVerified: Date | null  (PRESERVED)
// 4. Session receives:         emailVerified: Date | null  (PASSED THROUGH)
//
// This ensures type safety throughout the auth flow while maintaining
// compatibility between your boolean database field and Next-Auth's requirements.
//
// On the client, you can check:
// - if (session.user.emailVerified) { /* verified */ }
//
