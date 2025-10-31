// server/auth/config.ts
// FINAL COMPLETE FIXED VERSION - Copy this entire file

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import { verifyPassword } from "@/server/lib/crypto";
import { loginSchema } from "@/server/lib/validation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      
      async authorize(credentials) {
        try {
          const validated = loginSchema.parse({
            email: credentials?.email,
            password: credentials?.password,
          });

          await connectDB();

          const user = await User.findOne({ email: validated.email }).select(
            "+password +loginAttempts +lockUntil"
          );

          if (!user) {
            return null;
          }

          if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil(
              (user.lockUntil.getTime() - Date.now()) / 60000
            );
            throw new Error(
              `Account locked. Try again in ${minutesLeft} minutes.`
            );
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated. Contact support.");
          }

          if (user.isSuspended) {
            throw new Error(
              `Account suspended: ${user.suspensionReason || "Contact support"}`
            );
          }

          const isPasswordValid = await verifyPassword(
            validated.password,
            user.password
          );

          if (!isPasswordValid) {
            user.loginAttempts += 1;

            if (user.loginAttempts >= 5) {
              user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
            }

            await user.save();

            if (user.loginAttempts >= 5) {
              throw new Error("Account locked for 30 minutes.");
            }

            throw new Error(
              `Invalid password. ${5 - user.loginAttempts} attempts remaining.`
            );
          }

          user.loginAttempts = 0;
          user.lockUntil = undefined;
          user.lastLoginAt = new Date();
          await user.save();

          // FIXED: emailVerified must be Date | null, not boolean
          return {
            id: String(user._id),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            hasMFA: user.mfaEnabled,
            kycStatus: user.kycStatus,
            locale: user.locale || "en",
            emailVerified: user.emailVerified ? new Date() : null,  // Convert boolean to Date | null
          };
        } catch (error: any) {
          console.error("Authorization error:", error);
          throw error;
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
    error: "/login",
    verifyRequest: "/verify",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
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

      if (trigger === "update" && session) {
        token = { ...token, ...session };
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

    async signIn({ user }) {
      return true;
    },
  },

  events: {
    async signIn(message) {
      console.log("User signed in:", message.user.email);
    },
  },

  debug: process.env.NODE_ENV === "development",
});
