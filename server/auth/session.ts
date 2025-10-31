// /server/auth/session.ts
// Session utilities for accessing authenticated user data
// Provides helper functions for server components and server actions

import { auth } from "./config";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";

/**
 * Get current session
 * @returns Promise<Session | null> - Current session or null if not authenticated
 * 
 * Use in server components and server actions to get session data
 * 
 * Example:
 * ```ts
 * const session = await getSession();
 * if (!session) {
 *   return { error: "Not authenticated" };
 * }
 * ```
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user ID
 * @returns Promise<string | null> - User ID or null if not authenticated
 * 
 * Shorthand for getting just the user ID
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Get current user email
 * @returns Promise<string | null> - User email or null if not authenticated
 */
export async function getUserEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email || null;
}

/**
 * Check if user is authenticated
 * @returns Promise<boolean> - True if user is authenticated
 * 
 * Use for quick auth checks
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

/**
 * Require authentication
 * @throws Error if user is not authenticated
 * @returns Promise<Session> - Session object
 * 
 * Use at the start of protected server actions
 * Throws error if not authenticated (for early return)
 * 
 * Example:
 * ```ts
 * async function protectedAction() {
 *   const session = await requireAuth();
 *   // Continue with authenticated logic
 * }
 * ```
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  
  return session;
}

/**
 * Require specific role
 * @param role - Required role ("admin" or "user")
 * @throws Error if user doesn't have required role
 * @returns Promise<Session> - Session object
 * 
 * Use for role-based access control
 * 
 * Example:
 * ```ts
 * async function adminAction() {
 *   await requireRole("admin");
 *   // Continue with admin-only logic
 * }
 * ```
 */
export async function requireRole(role: "admin" | "user") {
  const session = await requireAuth();
  
  if (session.user.role !== role) {
    throw new Error(`${role} access required`);
  }
  
  return session;
}

/**
 * Require KYC verification
 * @throws Error if user's KYC is not verified
 * @returns Promise<Session> - Session object
 * 
 * Use for actions that require verified identity
 * 
 * Example:
 * ```ts
 * async function withdrawFunds() {
 *   await requireKYC();
 *   // Continue with withdrawal logic
 * }
 * ```
 */
export async function requireKYC() {
  const session = await requireAuth();
  
  if (session.user.kycStatus !== "verified") {
    throw new Error("KYC verification required for this action");
  }
  
  return session;
}

/**
 * Require MFA verification
 * @throws Error if user doesn't have MFA enabled
 * @returns Promise<Session> - Session object
 * 
 * Use for sensitive operations that require 2FA
 */
export async function requireMFA() {
  const session = await requireAuth();
  
  if (!session.user.hasMFA) {
    throw new Error("Multi-factor authentication required");
  }
  
  return session;
}

/**
 * Get full user document from database
 * @returns Promise<User | null> - Full user document or null
 * 
 * Use when you need complete user data beyond session
 * Fetches fresh data from database
 * 
 * Example:
 * ```ts
 * const user = await getCurrentUser();
 * if (!user) return { error: "User not found" };
 * console.log(user.wallet.balance.USD);
 * ```
 */
export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  await connectDB();
  
  const user = await User.findById(session.user.id);
  return user;
}

/**
 * Get user with specific fields selected
 * @param fields - Fields to select (space-separated string)
 * @returns Promise<User | null> - User document with selected fields
 * 
 * Use when you only need specific fields (optimization)
 * 
 * Example:
 * ```ts
 * const user = await getUserWithFields("email firstName wallet.balance");
 * ```
 */
export async function getUserWithFields(fields: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  await connectDB();
  
  const user = await User.findById(session.user.id).select(fields);
  return user;
}

/**
 * Check if current user owns a resource
 * @param resourceUserId - User ID associated with the resource
 * @returns Promise<boolean> - True if current user owns the resource
 * 
 * Use for authorization checks on user-specific resources
 * 
 * Example:
 * ```ts
 * if (!await isResourceOwner(transaction.userId)) {
 *   return { error: "Unauthorized" };
 * }
 * ```
 */
export async function isResourceOwner(resourceUserId: string): Promise<boolean> {
  const userId = await getUserId();
  return userId === resourceUserId;
}

/**
 * Require resource ownership
 * @param resourceUserId - User ID associated with the resource
 * @throws Error if current user doesn't own the resource
 * 
 * Use at the start of actions that modify user-specific resources
 */
export async function requireResourceOwnership(resourceUserId: string) {
  const isOwner = await isResourceOwner(resourceUserId);
  
  if (!isOwner) {
    throw new Error("Unauthorized - You don't own this resource");
  }
}

/**
 * Get user locale preference
 * @returns Promise<string> - User's preferred locale (default: "en")
 * 
 * Use for determining which language to use for emails, notifications, etc.
 */
export async function getUserLocale(): Promise<string> {
  const session = await auth();
  return session?.user?.locale || "en";
}

/**
 * Check if current session has admin privileges
 * @returns Promise<boolean> - True if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "admin";
}

/**
 * Check if user's KYC is verified
 * @returns Promise<boolean> - True if KYC is verified
 */
export async function isKYCVerified(): Promise<boolean> {
  const session = await auth();
  return session?.user?.kycStatus === "verified";
}

/**
 * Check if user has MFA enabled
 * @returns Promise<boolean> - True if MFA is enabled
 */
export async function hasMFAEnabled(): Promise<boolean> {
  const session = await auth();
  return session?.user?.hasMFA || false;
}
