// server/actions/admin/users.ts
// Purpose: Admin User Management Actions
// Allows administrators to view, search, manage, and moderate user accounts
// Includes permission checks, audit logging, and comprehensive user operations

"use server";

import { Types } from "mongoose";
import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import Wallet from "@/server/models/Wallet";
import Transaction from "@/server/models/Transaction";
import KYC from "@/server/models/KYC";
import {
  hasPermission,
  canModifyUser,
  canModifyRole,
  PERMISSIONS,
} from "@/lib/permissions";
import { auditUserAction, auditFailure } from "@/server/lib/audit";
import type { UserRole } from "@/types";

// =============================================================================
// TYPES & VALIDATION SCHEMAS
// =============================================================================

/**
 * User list filter options
 */
const userSearchSchema = z.object({
  query: z.string().optional(), // Search by name or email
  role: z
    .enum(["user", "operator", "admin", "superadmin", "auditor"])
    .optional(),
  kycStatus: z
    .enum(["none", "pending", "submitted", "verified", "rejected"])
    .optional(),
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  skip: z.number().min(0).default(0),
  sortBy: z
    .enum(["createdAt", "lastLoginAt", "email", "firstName"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

type UserSearchFilters = z.infer<typeof userSearchSchema>;

/**
 * User update schema
 */
const userUpdateSchema = z.object({
  userId: z.string(),
  updates: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().optional(),
    preferredCurrency: z
      .enum(["USD", "EUR", "GBP", "EGP", "AED", "SAR"])
      .optional(),
    preferredLanguage: z.enum(["en", "es", "fr", "ru", "ar"]).optional(),
  }),
  reason: z.string().optional(),
});

/**
 * Role change schema
 */
const roleChangeSchema = z.object({
  userId: z.string(),
  newRole: z.enum(["user", "operator", "admin", "superadmin", "auditor"]),
  reason: z.string().min(1, "Reason is required for role changes"),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Verify admin has permission to perform action
 */
async function verifyPermission(
  adminId: string,
  permission: string
): Promise<{
  success: boolean;
  admin?: any;
  error?: string;
}> {
  await dbConnect();

  const admin = await User.findById(adminId);
  if (!admin) {
    return { success: false, error: "Admin user not found" };
  }

  if (!hasPermission(admin.role, permission as any)) {
    return {
      success: false,
      error: `Insufficient permissions: ${permission} required`,
    };
  }

  return { success: true, admin };
}

// =============================================================================
// USER SEARCH & LISTING
// =============================================================================

/**
 * Get paginated list of users with filters
 * Permission: USER_VIEW
 */
export async function getUsers(
  adminId: string,
  filters: Partial<UserSearchFilters> = {}
): Promise<{
  success: boolean;
  data?: {
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}> {
  try {
    // Verify permission
    const permCheck = await verifyPermission(adminId, PERMISSIONS.USER_VIEW);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    // Validate filters
    const validated = userSearchSchema.parse(filters);

    await dbConnect();

    // Build query
    const query: any = {};

    if (validated.query) {
      query.$or = [
        { email: new RegExp(validated.query, "i") },
        { firstName: new RegExp(validated.query, "i") },
        { lastName: new RegExp(validated.query, "i") },
      ];
    }

    if (validated.role) query.role = validated.role;
    if (validated.kycStatus) query.kycStatus = validated.kycStatus;
    if (validated.isActive !== undefined) query.isActive = validated.isActive;
    if (validated.isSuspended !== undefined)
      query.isSuspended = validated.isSuspended;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -mfaSecret -mfaBackupCodes")
        .sort({ [validated.sortBy]: validated.sortOrder === "asc" ? 1 : -1 })
        .limit(validated.limit)
        .skip(validated.skip)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        users,
        total,
        page: Math.floor(validated.skip / validated.limit) + 1,
        totalPages: Math.ceil(total / validated.limit),
      },
    };
  } catch (error: any) {
    console.error("Get users error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch users",
    };
  }
}

/**
 * Search Users - for page compatibility
 */
export async function searchUsers(adminId: string, filters: any) {
  const queryFilters: any = {
    query: filters.search,
    role: filters.role,
    limit: filters.limit || 20,
  };
  
  // Only add status filters if explicitly set
  if (filters.status === "active") {
    queryFilters.isActive = true;
  } else if (filters.status === "suspended") {
    queryFilters.isSuspended = true;
  }
  // If status is undefined, don't filter by it at all
  
  return getUsers(adminId, queryFilters);
}

/**
 * Get user activity (placeholder - implement with audit logs)
 */
export async function getUserActivity(
  adminId: string,
  userId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  // TODO: Implement by fetching from audit logs
  return { success: true, data: [] };
}

/**
 * Get detailed user information including wallet and KYC
 * Permission: USER_VIEW
 */
export async function getUserDetails(
  adminId: string,
  userId: string
): Promise<{
  success: boolean;
  data?: {
    user: any;
    wallet: any;
    kyc: any;
    transactionCount: number;
    lastTransaction: any;
  };
  error?: string;
}> {
  try {
    // Verify permission
    const permCheck = await verifyPermission(adminId, PERMISSIONS.USER_VIEW);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Fetch user data
    const [user, wallet, kyc, transactionCount, lastTransaction] =
      await Promise.all([
        User.findById(userId)
          .select("-password -mfaSecret -mfaBackupCodes")
          .lean(),
        Wallet.findOne({ userId }).lean(),
        KYC.findOne({ userId }).lean(),
        Transaction.countDocuments({ userId }),
        Transaction.findOne({ userId }).sort({ createdAt: -1 }).lean(),
      ]);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: {
        user,
        wallet,
        kyc,
        transactionCount,
        lastTransaction,
      },
    };
  } catch (error: any) {
    console.error("Get user details error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user details",
    };
  }
}

// =============================================================================
// USER STATISTICS
// =============================================================================

/**
 * Get user statistics for dashboard
 * Permission: USER_VIEW
 */
export async function getUserStats(adminId: string): Promise<{
  success: boolean;
  data?: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    verifiedKYC: number;
    pendingKYC: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  error?: string;
}> {
  try {
    // Verify permission
    const permCheck = await verifyPermission(adminId, PERMISSIONS.USER_VIEW);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      verifiedKYC,
      pendingKYC,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      User.countDocuments({ kycStatus: "verified" }),
      User.countDocuments({ kycStatus: { $in: ["pending", "submitted"] } }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        verifiedKYC,
        pendingKYC,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      },
    };
  } catch (error: any) {
    console.error("Get user stats error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user statistics",
    };
  }
}

// =============================================================================
// USER MODIFICATION
// =============================================================================

/**
 * Update user details
 * Permission: USER_UPDATE
 */
export async function updateUser(
  adminId: string,
  data: z.infer<typeof userUpdateSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate input
    const validated = userUpdateSchema.parse(data);

    // Verify permission
    const permCheck = await verifyPermission(adminId, PERMISSIONS.USER_UPDATE);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get target user
    const targetUser = await User.findById(validated.userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Check if admin can modify this user
    const canModify = canModifyUser(
      permCheck.admin!.role,
      targetUser.role,
      adminId === validated.userId
    );

    if (!canModify.allowed) {
      await auditFailure({
        userId: adminId,
        userEmail: permCheck.admin!.email,
        userRole: permCheck.admin!.role,
        action: "user.update",
        category: "user",
        description: `Failed to update user ${targetUser.email}: ${canModify.reason}`,
        resource: "user",
        resourceId: validated.userId,
        resourceIdentifier: targetUser.email,
        error: canModify.reason!,
      });

      return { success: false, error: canModify.reason };
    }

    // Store old values for audit
    const oldValues: any = {};
    const newValues: any = {};

    // Update fields
    if (
      validated.updates.firstName &&
      validated.updates.firstName !== targetUser.firstName
    ) {
      oldValues.firstName = targetUser.firstName;
      targetUser.firstName = validated.updates.firstName;
      newValues.firstName = validated.updates.firstName;
    }

    if (
      validated.updates.lastName &&
      validated.updates.lastName !== targetUser.lastName
    ) {
      oldValues.lastName = targetUser.lastName;
      targetUser.lastName = validated.updates.lastName;
      newValues.lastName = validated.updates.lastName;
    }

    if (validated.updates.phone !== undefined) {
      oldValues.phone = targetUser.phone;
      targetUser.phone = validated.updates.phone || undefined;
      newValues.phone = validated.updates.phone || null;
    }

    if (validated.updates.preferredCurrency) {
      oldValues.preferredCurrency = targetUser.preferredCurrency;
      targetUser.preferredCurrency = validated.updates.preferredCurrency;
      newValues.preferredCurrency = validated.updates.preferredCurrency;
    }

    if (validated.updates.preferredLanguage) {
      oldValues.preferredLanguage = targetUser.preferredLanguage;
      targetUser.preferredLanguage = validated.updates.preferredLanguage;
      newValues.preferredLanguage = validated.updates.preferredLanguage;
    }

    // Recompute full name
    targetUser.fullName = `${targetUser.firstName} ${targetUser.lastName}`;

    await targetUser.save();

    // Audit log
    await auditUserAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "update",
      targetUserId: validated.userId,
      targetUserEmail: targetUser.email,
      changes: {
        before: oldValues,
        after: newValues,
      },
      reason: validated.reason,
    });

    return {
      success: true,
      data: {
        user: {
          id: targetUser._id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          fullName: targetUser.fullName,
        },
      },
    };
  } catch (error: any) {
    console.error("Update user error:", error);
    return {
      success: false,
      error: error.message || "Failed to update user",
    };
  }
}

/**
 * Suspend user account
 * Permission: USER_SUSPEND
 */
export async function suspendUser(
  adminId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        error: "Suspension reason is required (minimum 5 characters)",
      };
    }

    // Verify permission
    const permCheck = await verifyPermission(adminId, PERMISSIONS.USER_SUSPEND);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Check if admin can modify this user
    const canModify = canModifyUser(
      permCheck.admin!.role,
      targetUser.role,
      adminId === userId
    );

    if (!canModify.allowed) {
      await auditFailure({
        userId: adminId,
        userEmail: permCheck.admin!.email,
        userRole: permCheck.admin!.role,
        action: "user.suspend",
        category: "user",
        description: `Failed to suspend user ${targetUser.email}: ${canModify.reason}`,
        resource: "user",
        resourceId: userId,
        resourceIdentifier: targetUser.email,
        error: canModify.reason!,
      });

      return { success: false, error: canModify.reason };
    }

    // Suspend user
    targetUser.isSuspended = true;
    targetUser.suspensionReason = reason;
    await targetUser.save();

    // Audit log
    await auditUserAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "suspend",
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      reason,
    });

    return {
      success: true,
      data: {
        message: `User ${targetUser.email} has been suspended`,
      },
    };
  } catch (error: any) {
    console.error("Suspend user error:", error);
    return {
      success: false,
      error: error.message || "Failed to suspend user",
    };
  }
}

/**
 * Activate suspended user account
 * Permission: USER_SUSPEND
 */
export async function activateUser(
  adminId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Verify permission
    const permCheck = await verifyPermission(adminId, PERMISSIONS.USER_SUSPEND);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Activate user
    targetUser.isSuspended = false;
    targetUser.suspensionReason = undefined;
    targetUser.isActive = true;
    await targetUser.save();

    // Audit log
    await auditUserAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "activate",
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      reason: reason || "Account reactivated",
    });

    return {
      success: true,
      data: {
        message: `User ${targetUser.email} has been activated`,
      },
    };
  } catch (error: any) {
    console.error("Activate user error:", error);
    return {
      success: false,
      error: error.message || "Failed to activate user",
    };
  }
}

/**
 * Change user role
 * Permission: USER_CHANGE_ROLE
 */
export async function changeUserRole(
  adminId: string,
  data: z.infer<typeof roleChangeSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate input
    const validated = roleChangeSchema.parse(data);

    // Verify permission
    const permCheck = await verifyPermission(
      adminId,
      PERMISSIONS.USER_CHANGE_ROLE
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get target user
    const targetUser = await User.findById(validated.userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Check if admin can change this user's role
    const canChange = canModifyRole(
      permCheck.admin!.role,
      targetUser.role,
      validated.newRole,
      adminId === validated.userId
    );

    if (!canChange.allowed) {
      await auditFailure({
        userId: adminId,
        userEmail: permCheck.admin!.email,
        userRole: permCheck.admin!.role,
        action: "user.change_role",
        category: "user",
        description: `Failed to change role for ${targetUser.email}: ${canChange.reason}`,
        resource: "user",
        resourceId: validated.userId,
        resourceIdentifier: targetUser.email,
        error: canChange.reason!,
      });

      return { success: false, error: canChange.reason };
    }

    const oldRole = targetUser.role;
    targetUser.role = validated.newRole;
    await targetUser.save();

    // Audit log
    await auditUserAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "change_role",
      targetUserId: validated.userId,
      targetUserEmail: targetUser.email,
      changes: {
        before: { role: oldRole },
        after: { role: validated.newRole },
      },
      reason: validated.reason,
    });

    return {
      success: true,
      data: {
        message: `User role changed from ${oldRole} to ${validated.newRole}`,
      },
    };
  } catch (error: any) {
    console.error("Change user role error:", error);
    return {
      success: false,
      error: error.message || "Failed to change user role",
    };
  }
}

/**
 * Reset user password (sends email with reset link)
 * Permission: USER_RESET_PASSWORD
 */
export async function resetUserPassword(
  adminId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Verify permission
    const permCheck = await verifyPermission(
      adminId,
      PERMISSIONS.USER_RESET_PASSWORD
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Generate reset token (implement actual reset logic based on your auth system)
    // This is a placeholder - you'll need to integrate with your existing password reset flow
    // const resetToken = await generatePasswordResetToken(userId);
    // await sendPasswordResetEmail(targetUser.email, resetToken);

    // Audit log
    await auditUserAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "reset_password",
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      reason: reason || "Admin-initiated password reset",
    });

    return {
      success: true,
      data: {
        message: `Password reset email sent to ${targetUser.email}`,
      },
    };
  } catch (error: any) {
    console.error("Reset user password error:", error);
    return {
      success: false,
      error: error.message || "Failed to reset user password",
    };
  }
}
