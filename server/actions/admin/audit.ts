// server/actions/admin/audit.ts
// Purpose: Admin Audit Log Query Actions
// Search and retrieve audit logs for compliance and security review

"use server";

import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import AuditLog from "@/server/models/AuditLog";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const auditSearchSchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  action: z.string().optional(),
  category: z.enum(["kyc", "user", "transaction", "config", "system", "auth"]).optional(),
  resource: z.string().optional(),
  status: z.enum(["success", "failure", "partial"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  skip: z.number().min(0).default(0),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function verifyAuditPermission(
  adminId: string
): Promise<{
  success: boolean;
  admin?: any;
  error?: string;
}> {
  await dbConnect();
  const admin = await User.findById(adminId);
  if (!admin || !hasPermission(admin.role, PERMISSIONS.AUDIT_VIEW)) {
    return { success: false, error: "Insufficient permissions" };
  }
  return { success: true, admin };
}

// =============================================================================
// AUDIT LOG QUERIES
// =============================================================================

/**
 * Search audit logs with filters
 * Permission: AUDIT_VIEW
 */
export async function searchAuditLogs(
  adminId: string,
  filters: Partial<z.infer<typeof auditSearchSchema>> = {}
): Promise<{
  success: boolean;
  data?: {
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyAuditPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    const validated = auditSearchSchema.parse(filters);

    await dbConnect();

    const searchFilters: any = {};

    if (validated.userId) searchFilters.userId = validated.userId;
    if (validated.userEmail) searchFilters.userEmail = validated.userEmail;
    if (validated.action) searchFilters.action = validated.action;
    if (validated.category) searchFilters.category = validated.category;
    if (validated.resource) searchFilters.resource = validated.resource;
    if (validated.status) searchFilters.status = validated.status;
    if (validated.startDate) {
      searchFilters.startDate = new Date(validated.startDate);
    }
    if (validated.endDate) {
      searchFilters.endDate = new Date(validated.endDate);
    }
    searchFilters.limit = validated.limit;
    searchFilters.skip = validated.skip;

    const result = await AuditLog.search(searchFilters);

    return {
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        page: Math.floor(validated.skip / validated.limit) + 1,
        totalPages: Math.ceil(result.total / validated.limit),
      },
    };
  } catch (error: any) {
    console.error("Search audit logs error:", error);
    return {
      success: false,
      error: error.message || "Failed to search audit logs",
    };
  }
}

/**
 * Get recent system activity
 * Permission: AUDIT_VIEW
 */
export async function getRecentActivity(
  adminId: string,
  limit: number = 20
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const permCheck = await verifyAuditPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: logs,
    };
  } catch (error: any) {
    console.error("Get recent activity error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch recent activity",
    };
  }
}

/**
 * Get audit trail for specific resource
 * Permission: AUDIT_VIEW
 */
export async function getResourceAuditTrail(
  adminId: string,
  resourceId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const permCheck = await verifyAuditPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const logs = await AuditLog.getResourceHistory(resourceId, limit);

    return {
      success: true,
      data: logs,
    };
  } catch (error: any) {
    console.error("Get resource audit trail error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch audit trail",
    };
  }
}

/**
 * Get admin user's activity
 * Permission: AUDIT_VIEW
 */
export async function getUserAuditHistory(
  adminId: string,
  targetUserId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const permCheck = await verifyAuditPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const logs = await AuditLog.getUserActivity(targetUserId, limit);

    return {
      success: true,
      data: logs,
    };
  } catch (error: any) {
    console.error("Get user audit history error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch user audit history",
    };
  }
}

