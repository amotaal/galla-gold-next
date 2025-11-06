// server/actions/admin/config.ts
// Purpose: Admin System Configuration Management
// Allows administrators to view and modify dynamic system settings
// All changes are logged and validated

"use server";

import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import SystemConfig from "@/server/models/SystemConfig";
import {
  hasPermission,
  canUpdateCriticalConfig,
  PERMISSIONS,
} from "@/lib/permissions";
import { auditConfigChange } from "@/server/lib/audit";
import type {
  ConfigCategory,
  ConfigDataType,
} from "@/server/models/SystemConfig";

// Function aliases for page compatibility
export { getConfig as getSystemConfigs, updateConfig as updateSystemConfig };

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const configUpdateSchema = z.object({
  key: z.string(),
  value: z.any(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function verifyConfigPermission(
  adminId: string,
  configKey?: string
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

  // Check basic config view permission
  if (!hasPermission(admin.role, PERMISSIONS.CONFIG_VIEW)) {
    return {
      success: false,
      error: "Insufficient permissions: CONFIG_VIEW required",
    };
  }

  // If updating a config, check if it's critical
  if (configKey) {
    const config = await SystemConfig.findOne({ key: configKey.toUpperCase() });
    if (config?.requiresSuperAdmin && !canUpdateCriticalConfig(admin.role)) {
      return {
        success: false,
        error: "This configuration requires super admin permissions",
      };
    }
  }

  return { success: true, admin };
}

// =============================================================================
// CONFIGURATION RETRIEVAL
// =============================================================================

/**
 * Get all configurations grouped by category
 * Permission: CONFIG_VIEW
 */
export async function getAllConfigs(adminId: string): Promise<{
  success: boolean;
  data?: Record<string, any>; // ✅ Changed to key-value pairs
  error?: string;
}> {
  try {
    const permCheck = await verifyConfigPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const configs = await SystemConfig.find({ isActive: true })
      .sort({ key: 1 })
      .lean();

    // ✅ Convert to key-value object for easy access
    const configMap: Record<string, any> = {};
    configs.forEach((config) => {
      configMap[config.key] = config.value;
    });

    return {
      success: true,
      data: configMap, // ✅ Returns { GOLD_PURCHASE_FEE: 2, MIN_DEPOSIT: 10, ... }
    };
  } catch (error: any) {
    console.error("Get all configs error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch configurations",
    };
  }
}

/**
 * Get configurations by category
 * Permission: CONFIG_VIEW
 */
export async function getConfigsByCategory(
  adminId: string,
  category: ConfigCategory
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const permCheck = await verifyConfigPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const configs = await SystemConfig.getByCategory(category);

    return {
      success: true,
      data: configs,
    };
  } catch (error: any) {
    console.error("Get configs by category error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch configurations",
    };
  }
}

/**
 * Get single configuration
 * Permission: CONFIG_VIEW
 */
export async function getConfig(
  adminId: string,
  key: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const permCheck = await verifyConfigPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const config = await SystemConfig.findOne({
      key: key.toUpperCase(),
      isActive: true,
    }).lean();

    if (!config) {
      return { success: false, error: "Configuration not found" };
    }

    return {
      success: true,
      data: config,
    };
  } catch (error: any) {
    console.error("Get config error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch configuration",
    };
  }
}

/**
 * Get configuration change history
 * Permission: CONFIG_VIEW
 */
export async function getConfigHistory(
  adminId: string,
  key: string,
  limit: number = 20
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const permCheck = await verifyConfigPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const config = await SystemConfig.findOne({
      key: key.toUpperCase(),
    }).lean();

    if (!config) {
      return { success: false, error: "Configuration not found" };
    }

    // Get change history
    const history = config.changeHistory
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);

    return {
      success: true,
      data: history,
    };
  } catch (error: any) {
    console.error("Get config history error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch configuration history",
    };
  }
}

// =============================================================================
// CONFIGURATION UPDATES
// =============================================================================

/**
 * Update configuration value
 * Permission: CONFIG_UPDATE or CONFIG_UPDATE_CRITICAL
 */
export async function updateConfig(
  adminId: string,
  data: z.infer<typeof configUpdateSchema>
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validated = configUpdateSchema.parse(data);

    const permCheck = await verifyConfigPermission(adminId, validated.key);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    // Check if admin has permission to update configs
    if (!hasPermission(permCheck.admin!.role, PERMISSIONS.CONFIG_UPDATE)) {
      return {
        success: false,
        error: "Insufficient permissions: CONFIG_UPDATE required",
      };
    }

    await dbConnect();

    // Get current config
    const config = await SystemConfig.findOne({
      key: validated.key.toUpperCase(),
    });

    if (!config) {
      return { success: false, error: "Configuration not found" };
    }

    if (!config.isActive) {
      return { success: false, error: "Configuration is inactive" };
    }

    // Simple validation - check type matches
    const validation = { valid: true, error: null };

    if (config.dataType === "number" && typeof validated.value !== "number") {
      return { success: false, error: "Value must be a number" };
    }
    if (config.dataType === "boolean" && typeof validated.value !== "boolean") {
      return { success: false, error: "Value must be a boolean" };
    }

    // Store old value for audit
    const oldValue = config.value;

    // Update config
    await SystemConfig.setValue(
      validated.key,
      validated.value,
      adminId,
      permCheck.admin!.email,
      validated.reason
    );

    // Audit log
    await auditConfigChange({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      configKey: validated.key,
      oldValue,
      newValue: validated.value,
      reason: validated.reason,
    });

    return {
      success: true,
      data: {
        message: `Configuration ${validated.key} updated successfully`,
        oldValue,
        newValue: validated.value,
      },
    };
  } catch (error: any) {
    console.error("Update config error:", error);
    return {
      success: false,
      error: error.message || "Failed to update configuration",
    };
  }
}

/**
 * Reset configuration to default value
 * Permission: CONFIG_RESET
 */
export async function resetConfig(
  adminId: string,
  key: string,
  reason?: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const permCheck = await verifyConfigPermission(adminId, key);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    if (!hasPermission(permCheck.admin!.role, PERMISSIONS.CONFIG_RESET)) {
      return {
        success: false,
        error: "Insufficient permissions: CONFIG_RESET required",
      };
    }

    await dbConnect();

    const config = await SystemConfig.findOne({ key: key.toUpperCase() });

    if (!config) {
      return { success: false, error: "Configuration not found" };
    }

    const oldValue = config.value;
    const defaultValue = config.defaultValue;

    // Reset to default
    await SystemConfig.resetToDefault(
      key,
      adminId,
      permCheck.admin!.email,
      reason || "Reset to default value"
    );

    // Audit log
    await auditConfigChange({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      configKey: key,
      oldValue,
      newValue: defaultValue,
      reason: reason || "Reset to default value",
    });

    return {
      success: true,
      data: {
        message: `Configuration ${key} reset to default`,
        oldValue,
        newValue: defaultValue,
      },
    };
  } catch (error: any) {
    console.error("Reset config error:", error);
    return {
      success: false,
      error: error.message || "Failed to reset configuration",
    };
  }
}

/**
 * Bulk update configurations
 * Permission: CONFIG_UPDATE
 */
export async function bulkUpdateConfigs(
  adminId: string,
  updates: Array<{ key: string; value: any }>,
  reason: string
): Promise<{
  success: boolean;
  data?: {
    updated: number;
    failed: number;
    errors: string[];
  };
  error?: string;
}> {
  try {
    if (!reason || reason.length < 5) {
      return { success: false, error: "Reason must be at least 5 characters" };
    }

    if (updates.length === 0) {
      return { success: false, error: "No updates provided" };
    }

    if (updates.length > 50) {
      return {
        success: false,
        error: "Maximum 50 configs can be updated at once",
      };
    }

    const permCheck = await verifyConfigPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    if (!hasPermission(permCheck.admin!.role, PERMISSIONS.CONFIG_UPDATE)) {
      return {
        success: false,
        error: "Insufficient permissions: CONFIG_UPDATE required",
      };
    }

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each update
    for (const update of updates) {
      const result = await updateConfig(adminId, {
        key: update.key,
        value: update.value,
        reason,
      });

      if (result.success) {
        updated++;
      } else {
        failed++;
        errors.push(`${update.key}: ${result.error}`);
      }
    }

    return {
      success: true,
      data: {
        updated,
        failed,
        errors,
      },
    };
  } catch (error: any) {
    console.error("Bulk update configs error:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk update configurations",
    };
  }
}

// =============================================================================
// CONFIGURATION CREATION (for initialization)
// =============================================================================

/**
 * Create or update configuration
 * Permission: CONFIG_UPDATE (Super Admin only for new configs)
 */
export async function upsertConfig(
  adminId: string,
  configData: {
    key: string;
    value: any;
    dataType: ConfigDataType;
    category: ConfigCategory;
    displayName: string;
    description: string;
    defaultValue: any;
    unit?: string;
    subcategory?: string;
    validation?: any;
    isPublic?: boolean;
    requiresSuperAdmin?: boolean;
  }
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const permCheck = await verifyConfigPermission(adminId);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    // Only super admins can create new configs
    if (permCheck.admin!.role !== "superadmin") {
      return {
        success: false,
        error: "Only super administrators can create new configurations",
      };
    }

    await dbConnect();

    const config = await SystemConfig.upsert(
      configData,
      adminId,
      permCheck.admin!.email
    );

    return {
      success: true,
      data: config,
    };
  } catch (error: any) {
    console.error("Upsert config error:", error);
    return {
      success: false,
      error: error.message || "Failed to create/update configuration",
    };
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  getAllConfigs,
  getConfigsByCategory,
  getConfig,
  getConfigHistory,
  updateConfig,
  resetConfig,
  bulkUpdateConfigs,
  upsertConfig,
};
