// /server/auth/config.ts
// Auth.js v5 configuration with credentials provider and session management
// Handles authentication, JWT tokens, and session persistence

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import { verifyPassword } from "@/server/lib/crypto";
import { loginSchema } from "@/server/lib/validation";

/**
 * Auth.js v5 Configuration
 * 
 * Features:
 * - Credentials-based authentication (email/password)
 * - JWT session strategy for serverless compatibility
 * - Custom session data (userId, email, role, etc.)
 * - Login attempt tracking and account locking
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // ============================================================================
  // PROVIDERS CONFIGURATION
  // ============================================================================
  
  providers: [
    /**
     * Credentials Provider
     * Handles email/password authentication with database lookup
     */
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      
      /**
       * Authorization logic
       * Validates credentials and returns user data
       */
      async authorize(credentials) {
        try {
          // Validate input using Zod schema
          const validated = loginSchema.parse({
            email: credentials?.email,
            password: credentials?.password,
          });

          // Connect to database
          await connectDB();

          // Find user by email
          const user = await User.findOne({ email: validated.email }).select(
            "+password +loginAttempts +lockedUntil"
          );

          // User not found
          if (!user) {
            return null;
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil(
              (user.lockedUntil.getTime() - Date.now()) / 60000
            );
            throw new Error(
              `Account locked. Try again in ${minutesLeft} minutes.`
            );
          }

          // Check if account is active
          if (!user.isActive) {
            throw new Error("Account is deactivated. Contact support.");
          }

          // Verify password
          const isValidPassword = await verifyPassword(
            validated.password,
            user.password
          );

          if (!isValidPassword) {
            // Increment failed login attempts
            user.loginAttempts += 1;
            
            // Lock account after 5 failed attempts (30 minutes)
            if (user.loginAttempts >= 5) {
              user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
              await user.save();
              throw new Error(
                "Too many failed login attempts. Account locked for 30 minutes."
              );
            }
            
            await user.save();
            return null;
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error(
              "Email not verified. Please check your inbox for verification link."
            );
          }

          // Successful login - reset attempts and update last login
          user.loginAttempts = 0;
          user.lockedUntil = undefined;
          user.lastLogin = new Date();
          await user.save();

          // Return user object for session
          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            hasMFA: user.mfaEnabled,
            kycStatus: user.kycStatus,
            locale: user.preferredLanguage,
          };
        } catch (error: any) {
          // Log error for debugging
          console.error("Auth error:", error);
          
          // Rethrow validation errors
          throw error;
        }
      },
    }),
  ],

  // ============================================================================
  // SESSION CONFIGURATION
  // ============================================================================
  
  /**
   * Session strategy: JWT
   * Required for serverless/edge deployments
   * Stores session data in encrypted JWT token (no database calls)
   */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ============================================================================
  // JWT CONFIGURATION
  // ============================================================================
  
  /**
   * JWT secret from environment
   * Used for signing and verifying tokens
   */
  secret: process.env.NEXTAUTH_SECRET,

  // ============================================================================
  // CALLBACKS
  // ============================================================================
  
  callbacks: {
    /**
     * JWT Callback
     * Called when JWT is created or updated
     * Add custom data to token
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.hasMFA = user.hasMFA;
        token.kycStatus = user.kycStatus;
        token.locale = user.locale;
      }

      // Handle session updates (when user updates profile)
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    /**
     * Session Callback
     * Called when session is checked
     * Add JWT data to session object
     */
    async session({ session, token }) {
      // Add user data from token to session
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as "user" | "admin",
          hasMFA: token.hasMFA as boolean,
          kycStatus: token.kycStatus as "none" | "pending" | "verified" | "rejected",
          locale: token.locale as string,
        };
      }

      return session;
    },
  },

  // ============================================================================
  // PAGES CONFIGURATION
  // ============================================================================
  
  /**
   * Custom auth pages
   * Redirect to our custom login page instead of Auth.js default
   */
  pages: {
    signIn: "/login",
    error: "/login", // Error page
    verifyRequest: "/verify", // Email verification page
  },

  // ============================================================================
  // EVENTS
  // ============================================================================
  
  /**
   * Event handlers for auth lifecycle
   * Useful for logging, analytics, etc.
   */
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },

  // ============================================================================
  // DEBUGGING (only in development)
  // ============================================================================
  
  debug: process.env.NODE_ENV === "development",
});
