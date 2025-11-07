// server/lib/audit.ts
// Purpose: Audit Logging Helper Utilities
// Simplifies creating audit log entries throughout the admin system
// Provides consistent logging interface for all admin actions

"use server";

import { headers } from "next/headers";
import AuditLog, { IAuditLog } from "@/server/models/AuditLog";
import { Types } from "mongoose";

// =============================================================================
// TYPES
// =============================================================================

export interface AuditLogParams {
  // Required fields
  userId: Types.ObjectId | string;
  userEmail: string;
  userRole: "superadmin" | "admin" | "operator" | "auditor" | "user";
  action: string;
  category: "kyc" | "user" | "transaction" | "config" | "system" | "auth";
  description: string;
  resource: string;

  // Optional fields
  resourceId?: Types.ObjectId | string;
  resourceIdentifier?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  status?: "success" | "failure" | "partial";
  errorMessage?: string;
  errorCode?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get client IP address from headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Try various headers in order of preference
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headersList.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

/**
 * Get user agent from headers
 */
export async function getUserAgent(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get("user-agent") || undefined;
}

/**
 * Get HTTP method from headers
 */
export async function getHttpMethod(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get("x-http-method") || undefined;
}

// =============================================================================
// MAIN AUDIT LOGGING FUNCTIONS
// =============================================================================

/**
 * Create an audit log entry
 * Main function used throughout the admin system
 */
export async function createAuditLog(
  params: AuditLogParams
): Promise<IAuditLog> {
  try {
    // Get request metadata
    const ipAddress = await getClientIP();
    const userAgent = await getUserAgent();
    const httpMethod = await getHttpMethod();

    // Create the audit log
    const auditLog = await AuditLog.log({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      category: params.category,
      description: params.description,
      resource: params.resource,
      resourceId: params.resourceId,
      resourceIdentifier: params.resourceIdentifier,
      changes: params.changes,
      metadata: params.metadata,
      ipAddress,
      userAgent,
      httpMethod,
      status: params.status || "success",
      errorMessage: params.errorMessage,
      errorCode: params.errorCode,
    });

    return auditLog;
  } catch (error) {
    // Log to console if audit logging fails (don't throw to avoid breaking operations)
    console.error("Failed to create audit log:", error);
    throw error; // Re-throw so caller knows it failed
  }
}

/**
 * Create audit log for successful action
 * Convenience wrapper for success cases
 */
export async function auditSuccess(
  params: Omit<AuditLogParams, "status">
): Promise<IAuditLog> {
  return createAuditLog({
    ...params,
    status: "success",
  });
}

/**
 * Create audit log for failed action
 * Convenience wrapper for failure cases
 */
export async function auditFailure(
  params: Omit<AuditLogParams, "status"> & {
    error: Error | string;
    errorCode?: string;
  }
): Promise<IAuditLog> {
  const errorMessage =
    typeof params.error === "string" ? params.error : params.error.message;

  return createAuditLog({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: params.action,
    category: params.category,
    description: params.description,
    resource: params.resource,
    resourceId: params.resourceId,
    resourceIdentifier: params.resourceIdentifier,
    changes: params.changes,
    metadata: params.metadata,
    status: "failure",
    errorMessage,
    errorCode: params.errorCode,
  });
}

// =============================================================================
// SPECIALIZED AUDIT FUNCTIONS
// =============================================================================

/**
 * Audit user management action
 */
export async function auditUserAction(params: {
  adminId: Types.ObjectId | string;
  adminEmail: string;
  adminRole: "superadmin" | "admin" | "operator";
  action:
    | "create"
    | "update"
    | "suspend"
    | "activate"
    | "delete"
    | "reset_password"
    | "change_role";
  targetUserId: Types.ObjectId | string;
  targetUserEmail: string;
  changes?: { before?: any; after?: any };
  reason?: string;
}): Promise<IAuditLog> {
  return createAuditLog({
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: params.adminRole,
    action: `user.${params.action}`,
    category: "user",
    description: `${params.action.replace("_", " ")} user ${
      params.targetUserEmail
    }`,
    resource: "user",
    resourceId: params.targetUserId,
    resourceIdentifier: params.targetUserEmail,
    changes: params.changes,
    metadata: {
      reason: params.reason,
      action: params.action,
    },
  });
}

/**
 * Audit KYC action
 */
export async function auditKYCAction(params: {
  adminId: Types.ObjectId | string;
  adminEmail: string;
  adminRole: "superadmin" | "admin" | "operator";
  action: "approve" | "reject" | "request_documents";
  kycId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  userEmail: string;
  reason?: string;
  notes?: string;
}): Promise<IAuditLog> {
  return createAuditLog({
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: params.adminRole,
    action: `kyc.${params.action}`,
    category: "kyc",
    description: `${params.action} KYC for ${params.userEmail}`,
    resource: "kyc",
    resourceId: params.kycId,
    resourceIdentifier: params.userEmail,
    metadata: {
      reason: params.reason,
      notes: params.notes,
      targetUserId: params.userId,
      action: params.action,
    },
  });
}

/**
 * Audit transaction action
 */
export async function auditTransactionAction(params: {
  adminId: Types.ObjectId | string;
  adminEmail: string;
  adminRole: "superadmin" | "admin" | "operator";
  action:
    | "flag"
    | "unflag"
    | "cancel"
    | "refund"
    | "complete"
    | "review"
    | "approve"
    | "decline"
    | "accept"
    | "reject"
    | "confirm"
    | "deny";
  transactionId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  userEmail: string;
  reason?: string;
  notes?: string;
}): Promise<IAuditLog> {
  return createAuditLog({
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: params.adminRole,
    action: `transaction.${params.action}`,
    category: "transaction",
    description: `${params.action} transaction for ${params.userEmail}`,
    resource: "transaction",
    resourceId: params.transactionId,
    resourceIdentifier: params.transactionId.toString(),
    metadata: {
      reason: params.reason,
      notes: params.notes,
      targetUserId: params.userId,
      action: params.action,
    },
  });
}

/**
 * Audit configuration change
 */
export async function auditConfigChange(params: {
  adminId: Types.ObjectId | string;
  adminEmail: string;
  adminRole: "superadmin" | "admin";
  configKey: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}): Promise<IAuditLog> {
  return createAuditLog({
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: params.adminRole,
    action: "config.update",
    category: "config",
    description: `Updated configuration: ${params.configKey}`,
    resource: "config",
    resourceIdentifier: params.configKey,
    changes: {
      before: { value: params.oldValue },
      after: { value: params.newValue },
    },
    metadata: {
      reason: params.reason,
      configKey: params.configKey,
    },
  });
}

/**
 * Audit system action
 */
export async function auditSystemAction(params: {
  adminId: Types.ObjectId | string;
  adminEmail: string;
  adminRole: "superadmin" | "admin";
  action: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<IAuditLog> {
  return createAuditLog({
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: params.adminRole,
    action: `system.${params.action}`,
    category: "system",
    description: params.description,
    resource: "system",
    metadata: params.metadata,
  });
}

/**
 * Audit authentication action (login, logout, permission denied)
 */
export async function auditAuthAction(params: {
  userId: Types.ObjectId | string;
  userEmail: string;
  userRole: "superadmin" | "admin" | "operator" | "auditor" | "user";
  action:
    | "login"
    | "logout"
    | "failed_login"
    | "permission_denied"
    | "access_denied";
  description: string;
  metadata?: Record<string, any>;
  status?: "success" | "failure";
}): Promise<IAuditLog> {
  return createAuditLog({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: `auth.${params.action}`,
    category: "auth",
    description: params.description,
    resource: "auth",
    metadata: params.metadata,
    status: params.status,
  });
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Get recent activity across the system
 */
export async function getRecentActivity(
  limit: number = 20
): Promise<IAuditLog[]> {
  return AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean() as any as IAuditLog[];
}

/**
 * Get user's admin activity
 */
export async function getUserAuditHistory(
  userId: Types.ObjectId | string,
  limit: number = 50
): Promise<IAuditLog[]> {
  return AuditLog.getUserActivity(userId, limit);
}

/**
 * Get audit trail for a specific resource
 */
export async function getResourceAuditTrail(
  resourceId: Types.ObjectId | string,
  limit: number = 50
): Promise<IAuditLog[]> {
  return AuditLog.getResourceHistory(resourceId, limit);
}

/**
 * Search audit logs with filters
 */
export async function searchAuditLogs(filters: {
  userId?: Types.ObjectId | string;
  userEmail?: string;
  action?: string;
  category?: "kyc" | "user" | "transaction" | "config" | "system" | "auth";
  resource?: string;
  status?: "success" | "failure" | "partial";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}): Promise<{ logs: IAuditLog[]; total: number }> {
  return AuditLog.search(filters);
}
