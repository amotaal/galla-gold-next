// auth.config.ts
// FINAL COMPLETE FIXED VERSION - Copy this entire file

import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import { verifyPassword } from "@/server/lib/crypto";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await connectDB();

          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          }).select('+password +loginAttempts +lockUntil');

          if (!user) {
            throw new Error("No user found with this email");
          }

          if (!user.isActive) {
            throw new Error("Account is disabled");
          }

          if (user.isSuspended) {
            throw new Error(`Account is suspended: ${user.suspensionReason || "Contact support"}`);
          }

          if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            throw new Error(`Account is locked. Try again in ${minutesLeft} minutes.`);
          }

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            user.loginAttempts += 1;

            if (user.loginAttempts >= 5) {
              user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
              await user.save();
              throw new Error("Too many failed login attempts. Account locked for 30 minutes.");
            }

            await user.save();
            throw new Error(`Invalid password. ${5 - user.loginAttempts} attempts remaining.`);
          }

          user.loginAttempts = 0;
          user.lockUntil = undefined;
          user.lastLoginAt = new Date();
          await user.save();

          // FIXED: emailVerified is Date | null, not boolean
          return {
            id: String(user._id),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            hasMFA: user.mfaEnabled,
            kycStatus: user.kycStatus,
            locale: user.locale || 'en',
            emailVerified: user.emailVerified ? new Date() : null,  // Convert boolean to Date | null
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
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
        token.emailVerified = user.emailVerified;  // Already Date | null
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as "user" | "admin",
          hasMFA: token.hasMFA as boolean,
          kycStatus: token.kycStatus as "none" | "pending" | "submitted" | "verified" | "rejected",
          locale: token.locale as string,
          emailVerified: token.emailVerified as Date | null,  // Keep as Date | null
          mfaEnabled: token.hasMFA as boolean,
          avatar: undefined,
          phone: undefined,
        };
      }
      return session;
    },
  },
};
