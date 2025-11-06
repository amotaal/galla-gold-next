// /lib/permissions.ts
// Purpose: Permission Checking Utilities for Role-Based Access Control (RBAC)
// Defines what each role can do and provides helper functions to check permissions
// Used throughout admin actions to enforce access control

import type { UserRole } from "@/types";

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

/**
 * All available permissions in the system
 */
export const PERMISSIONS = {
  // User Management
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_SUSPEND: "user.suspend",
  USER_DELETE: "user.delete",
  USER_CHANGE_ROLE: "user.change_role",
  USER_RESET_PASSWORD: "user.reset_password",

  // KYC Management
  KYC_VIEW: "kyc.view",
  KYC_REVIEW: "kyc.review",
  KYC_APPROVE: "kyc.approve",
  KYC_REJECT: "kyc.reject",
  KYC_REQUEST_DOCUMENTS: "kyc.request_documents",

  // Transaction Management
  TRANSACTION_VIEW: "transaction.view",
  TRANSACTION_FLAG: "transaction.flag",
  TRANSACTION_CANCEL: "transaction.cancel",
  TRANSACTION_REFUND: "transaction.refund",
  TRANSACTION_EXPORT: "transaction.export",

  // System Configuration
  CONFIG_VIEW: "config.view",
  CONFIG_UPDATE: "config.update",
  CONFIG_RESET: "config.reset",
  CONFIG_UPDATE_CRITICAL: "config.update_critical", // Critical configs like fees

  // Reports & Analytics
  REPORTS_VIEW: "reports.view",
  REPORTS_GENERATE: "reports.generate",
  REPORTS_EXPORT: "reports.export",

  // Audit Logs
  AUDIT_VIEW: "audit.view",
  AUDIT_EXPORT: "audit.export",

  // Support Tickets (Phase 2)
  TICKET_VIEW: "ticket.view",
  TICKET_ASSIGN: "ticket.assign",
  TICKET_RESPOND: "ticket.respond",
  TICKET_CLOSE: "ticket.close",

  // System Actions
  SYSTEM_BACKUP: "system.backup",
  SYSTEM_MAINTENANCE: "system.maintenance",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// =============================================================================
// ROLE-PERMISSION MAPPINGS
// =============================================================================

/**
 * Permissions granted to each role
 * Higher roles inherit all permissions from lower roles
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Regular user - no admin permissions
  user: [],

  // Auditor - read-only access to all data
  auditor: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.KYC_VIEW,
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.CONFIG_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,
    PERMISSIONS.TICKET_VIEW,
  ],

  // Operator - day-to-day operations
  operator: [
    // User management (limited)
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_UPDATE, // Can update user details but not roles
    PERMISSIONS.USER_RESET_PASSWORD,

    // KYC management (full)
    PERMISSIONS.KYC_VIEW,
    PERMISSIONS.KYC_REVIEW,
    PERMISSIONS.KYC_APPROVE,
    PERMISSIONS.KYC_REJECT,
    PERMISSIONS.KYC_REQUEST_DOCUMENTS,

    // Transaction management (limited)
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.TRANSACTION_FLAG,
    PERMISSIONS.TRANSACTION_EXPORT,

    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,

    // Audit (view only)
    PERMISSIONS.AUDIT_VIEW,

    // Support tickets (full)
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_RESPOND,
    PERMISSIONS.TICKET_CLOSE,
  ],

  // Admin - full operational access
  admin: [
    // User management (full except role changes to superadmin)
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_CHANGE_ROLE, // Can change roles except to superadmin
    PERMISSIONS.USER_RESET_PASSWORD,

    // KYC management (full)
    PERMISSIONS.KYC_VIEW,
    PERMISSIONS.KYC_REVIEW,
    PERMISSIONS.KYC_APPROVE,
    PERMISSIONS.KYC_REJECT,
    PERMISSIONS.KYC_REQUEST_DOCUMENTS,

    // Transaction management (full)
    PERMISSIONS.TRANSACTION_VIEW,
    PERMISSIONS.TRANSACTION_FLAG,
    PERMISSIONS.TRANSACTION_CANCEL,
    PERMISSIONS.TRANSACTION_REFUND,
    PERMISSIONS.TRANSACTION_EXPORT,

    // Configuration (non-critical)
    PERMISSIONS.CONFIG_VIEW,
    PERMISSIONS.CONFIG_UPDATE, // Can update most configs
    PERMISSIONS.CONFIG_RESET,

    // Reports (full)
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,

    // Audit (full)
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,

    // Support tickets (full)
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_RESPOND,
    PERMISSIONS.TICKET_CLOSE,
  ],

  // Super Admin - unrestricted access
  superadmin: [
    // All permissions from admin
    ...ROLE_PERMISSIONS.admin,

    // Additional critical permissions
    PERMISSIONS.CONFIG_UPDATE_CRITICAL, // Can update critical configs like fees
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_MAINTENANCE,

    // Note: Super admins can promote users to any role including superadmin
  ],
};

// =============================================================================
// PERMISSION CHECKING FUNCTIONS
// =============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role is an admin role (operator, admin, or superadmin)
 */
export function isAdminRole(role: UserRole): boolean {
  return ["operator", "admin", "superadmin"].includes(role);
}

/**
 * Check if a role is superadmin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "superadmin";
}

/**
 * Check if a role can modify another role
 * Rules:
 * - Super admins can modify any role
 * - Admins can modify operator and user roles only
 * - Operators cannot modify roles
 * - Nobody can modify their own role
 */
export function canModifyRole(
  modifierRole: UserRole,
  targetCurrentRole: UserRole,
  targetNewRole: UserRole,
  isSelf: boolean
): { allowed: boolean; reason?: string } {
  // Cannot modify own role
  if (isSelf) {
    return {
      allowed: false,
      reason: "Cannot modify your own role",
    };
  }

  // Super admin can modify any role
  if (modifierRole === "superadmin") {
    return { allowed: true };
  }

  // Admin can modify operator and user roles
  if (modifierRole === "admin") {
    const allowedRoles: UserRole[] = ["user", "operator", "admin"];

    if (!allowedRoles.includes(targetCurrentRole)) {
      return {
        allowed: false,
        reason: "Admins cannot modify superadmin roles",
      };
    }

    if (targetNewRole === "superadmin") {
      return {
        allowed: false,
        reason: "Admins cannot promote users to superadmin",
      };
    }

    return { allowed: true };
  }

  // Operators and regular users cannot modify roles
  return {
    allowed: false,
    reason: "Insufficient permissions to modify roles",
  };
}

/**
 * Check if a role can suspend/delete another user
 */
export function canModifyUser(
  modifierRole: UserRole,
  targetRole: UserRole,
  isSelf: boolean
): { allowed: boolean; reason?: string } {
  // Cannot modify self
  if (isSelf) {
    return {
      allowed: false,
      reason: "Cannot modify your own account",
    };
  }

  // Super admin can modify anyone except other super admins
  if (modifierRole === "superadmin") {
    if (targetRole === "superadmin") {
      return {
        allowed: false,
        reason: "Cannot modify other superadmin accounts",
      };
    }
    return { allowed: true };
  }

  // Admin can modify operators and regular users
  if (modifierRole === "admin") {
    if (["superadmin", "admin"].includes(targetRole)) {
      return {
        allowed: false,
        reason: "Admins cannot modify superadmin or other admin accounts",
      };
    }
    return { allowed: true };
  }

  // Operators cannot modify users
  return {
    allowed: false,
    reason: "Insufficient permissions to modify users",
  };
}

/**
 * Check if a role can approve/reject KYC
 */
export function canReviewKYC(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.KYC_APPROVE);
}

/**
 * Check if a role can update critical configuration
 */
export function canUpdateCriticalConfig(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.CONFIG_UPDATE_CRITICAL);
}

/**
 * Check if a role can perform system maintenance
 */
export function canPerformMaintenance(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.SYSTEM_MAINTENANCE);
}

// =============================================================================
// ROLE HIERARCHY
// =============================================================================

/**
 * Role hierarchy levels (higher number = more powerful)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  auditor: 1,
  operator: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Check if one role is higher than another in hierarchy
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    user: "User",
    auditor: "Auditor",
    operator: "Operator",
    admin: "Administrator",
    superadmin: "Super Administrator",
  };
  return names[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    user: "Standard user with access to trading and portfolio features",
    auditor: "Read-only access to all data for compliance and reporting",
    operator: "Day-to-day operations including KYC review and support",
    admin: "Full administrative access to manage users and system",
    superadmin: "Unrestricted access with ability to modify critical settings",
  };
  return descriptions[role];
}

// =============================================================================
// PERMISSION ERROR MESSAGES
// =============================================================================

/**
 * Get standard error message for permission denial
 */
export function getPermissionDeniedMessage(
  permission: Permission,
  role: UserRole
): string {
  return `Access denied: Your role (${getRoleName(role)}) does not have permission to perform this action (${permission})`;
}

/**
 * Create permission error object
 */
export function createPermissionError(permission: Permission, role: UserRole): Error {
  const error = new Error(getPermissionDeniedMessage(permission, role));
  error.name = "PermissionDeniedError";
  return error;
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  isAdminRole,
  isSuperAdmin,
  canModifyRole,
  canModifyUser,
  canReviewKYC,
  canUpdateCriticalConfig,
  canPerformMaintenance,
  isHigherRole,
  getRoleName,
  getRoleDescription,
  getPermissionDeniedMessage,
  createPermissionError,
};
