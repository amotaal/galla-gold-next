// /auth.config.ts
// FIXED NextAuth configuration with correct User type

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
          }).select('+password');

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

          // Return User type that NextAuth expects
          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`, // Combine firstName + lastName
            emailVerified: user.emailVerified,
          };
        } catch (error: any) {
          console.error("Authorization error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    verifyRequest: "/verify",
    newUser: "/dashboard",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.emailVerified = user.emailVerified;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }

      return session;
    },

    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const publicRoutes = ["/", "/login", "/signup", "/verify", "/reset-password"];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!isLoggedIn && !isPublicRoute) {
        return false;
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
        return false;
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },

  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
  
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export default authConfig;
