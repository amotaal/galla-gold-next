// server/models/SystemConfig.ts
// Purpose: System Configuration Model - Store and manage dynamic application settings
// Allows administrators to modify fees, limits, and other settings without code deployment
// All changes are tracked in an audit trail for compliance

import mongoose, { Schema, Document, Model, Types } from "mongoose";

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

/**
 * Configuration data types
 */
export type ConfigDataType =
  | "number"
  | "string"
  | "boolean"
  | "object"
  | "array";

/**
 * Configuration categories for organization
 */
export type ConfigCategory =
  | "fees" // Transaction fees
  | "limits" // Transaction and daily limits
  | "features" // Feature flags
  | "pricing" // Gold pricing markup
  | "security" // Security settings
  | "kyc" // KYC verification settings
  | "email" // Email settings
  | "general"; // General settings

/**
 * Configuration change history entry
 */
export interface IConfigChange {
  value: any;
  updatedBy: Types.ObjectId;
  updatedByEmail: string;
  updatedAt: Date;
  reason?: string;
}

/**
 * Validation rule for config values
 */
export interface IValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
  required?: boolean;
}

/**
 * SystemConfig Document Interface
 */
export interface ISystemConfig extends Document {
  _id: Types.ObjectId;

  // Configuration key (unique identifier)
  key: string; // e.g., 'GOLD_PURCHASE_FEE', 'DAILY_DEPOSIT_LIMIT'

  // Current value
  value: any; // Can be number, string, boolean, object, or array
  dataType: ConfigDataType;

  // Organization
  category: ConfigCategory;
  subcategory?: string; // Optional sub-categorization

  // Documentation
  displayName: string; // Human-readable name
  description: string; // What this config controls
  unit?: string; // e.g., '%', 'USD', 'grams', 'days'

  // Validation
  validation?: IValidationRule;
  defaultValue: any; // Factory default value

  // Security
  isPublic: boolean; // Can be viewed by non-admins
  requiresSuperAdmin: boolean; // Only super admins can modify

  // Change tracking
  lastUpdatedBy?: Types.ObjectId;
  lastUpdatedByEmail?: string;
  lastUpdatedAt?: Date;
  changeHistory: IConfigChange[]; // Full audit trail of changes

  // Status
  isActive: boolean;
  isDeprecated: boolean;
  deprecationNote?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// MONGOOSE SCHEMA
// =============================================================================

const ConfigChangeSchema = new Schema<IConfigChange>(
  {
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedByEmail: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reason: String,
  },
  { _id: false }
);

const ValidationRuleSchema = new Schema<IValidationRule>(
  {
    min: Number,
    max: Number,
    pattern: String,
    enum: [Schema.Types.Mixed],
    required: Boolean,
  },
  { _id: false }
);

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    // Configuration key
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      // Examples: 'GOLD_PURCHASE_FEE', 'DAILY_DEPOSIT_LIMIT', 'KYC_EXPIRY_DAYS'
    },

    // Current value
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    dataType: {
      type: String,
      enum: ["number", "string", "boolean", "object", "array"],
      required: true,
    },

    // Organization
    category: {
      type: String,
      enum: [
        "fees",
        "limits",
        "features",
        "pricing",
        "security",
        "kyc",
        "email",
        "general",
      ],
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      index: true,
    },

    // Documentation
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
      // Examples: '%', 'USD', 'grams', 'days', 'hours'
    },

    // Validation
    validation: ValidationRuleSchema,
    defaultValue: {
      type: Schema.Types.Mixed,
      required: true,
    },

    // Security
    isPublic: {
      type: Boolean,
      default: false,
      // If true, can be viewed by non-admin users
    },
    requiresSuperAdmin: {
      type: Boolean,
      default: false,
      // If true, only super admins can modify this config
    },

    // Change tracking
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedByEmail: String,
    lastUpdatedAt: Date,
    changeHistory: {
      type: [ConfigChangeSchema],
      default: [],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeprecated: {
      type: Boolean,
      default: false,
    },
    deprecationNote: String,
  },
  {
    timestamps: true,
    collection: "systemconfigs",
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound indexes for common queries
SystemConfigSchema.index({ category: 1, isActive: 1 });
SystemConfigSchema.index({ key: 1, isActive: 1 });

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Pre-save validation middleware
 * Ensures value matches validation rules
 */
SystemConfigSchema.pre("save", function (next) {
  // Validate against rules if present
  if (this.validation) {
    const rules = this.validation;
    const value = this.value;

    // Min/Max validation for numbers
    if (this.dataType === "number" && typeof value === "number") {
      if (rules.min !== undefined && value < rules.min) {
        return next(new Error(`Value must be at least ${rules.min}`));
      }
      if (rules.max !== undefined && value > rules.max) {
        return next(new Error(`Value must be at most ${rules.max}`));
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      return next(new Error(`Value must be one of: ${rules.enum.join(", ")}`));
    }

    // Required validation
    if (rules.required && (value === null || value === undefined)) {
      return next(new Error("Value is required"));
    }
  }

  next();
});

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get configuration value by key
 * Returns the value or default if not found
 */
SystemConfigSchema.statics.getValue = async function (
  key: string,
  defaultValue?: any
): Promise<any> {
  const config = await this.findOne({
    key: key.toUpperCase(),
    isActive: true,
  }).lean();

  if (config) {
    return config.value;
  }

  // If config not found, return provided default or the stored default
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  // Try to find the config even if inactive to get default
  const inactiveConfig = await this.findOne({ key: key.toUpperCase() }).lean();
  return inactiveConfig?.defaultValue ?? null;
};

/**
 * Set configuration value
 * Records change in history and updates lastUpdated fields
 */
SystemConfigSchema.statics.setValue = async function (
  key: string,
  value: any,
  updatedBy: Types.ObjectId | string,
  updatedByEmail: string,
  reason?: string
): Promise<ISystemConfig | null> {
  const config = await this.findOne({ key: key.toUpperCase() });

  if (!config) {
    throw new Error(`Configuration key '${key}' not found`);
  }

  // Add to change history
  config.changeHistory.push({
    value: config.value, // Store old value
    updatedBy: updatedBy as Types.ObjectId,
    updatedByEmail,
    updatedAt: new Date(),
    reason,
  });

  // Update current value
  config.value = value;
  config.lastUpdatedBy = updatedBy as Types.ObjectId;
  config.lastUpdatedByEmail = updatedByEmail;
  config.lastUpdatedAt = new Date();

  await config.save();
  return config;
};

/**
 * Get all configurations by category
 */
SystemConfigSchema.statics.getByCategory = async function (
  category: ConfigCategory
): Promise<ISystemConfig[]> {
  return this.find({ category, isActive: true }).sort({ key: 1 }).lean().exec();
};

/**
 * Reset configuration to default value
 */
SystemConfigSchema.statics.resetToDefault = async function (
  key: string,
  updatedBy: Types.ObjectId | string,
  updatedByEmail: string,
  reason?: string
): Promise<ISystemConfig | null> {
  const config = await this.findOne({ key: key.toUpperCase() });

  if (!config) {
    throw new Error(`Configuration key '${key}' not found`);
  }

  return (this as ISystemConfigModel).setValue(
    key,
    config.defaultValue,
    updatedBy,
    updatedByEmail,
    reason || "Reset to default"
  );
};

/**
 * Bulk get multiple configuration values
 */
SystemConfigSchema.statics.getMany = async function (
  keys: string[]
): Promise<Record<string, any>> {
  const configs = await this.find({
    key: { $in: keys.map((k) => k.toUpperCase()) },
    isActive: true,
  }).lean();

  const result: Record<string, any> = {};
  configs.forEach((config: ISystemConfig) => {
    result[config.key] = config.value;
  });

  return result;
};

/**
 * Create or update configuration
 */
SystemConfigSchema.statics.upsert = async function (
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
    validation?: IValidationRule;
    isPublic?: boolean;
    requiresSuperAdmin?: boolean;
  },
  updatedBy?: Types.ObjectId | string,
  updatedByEmail?: string
): Promise<ISystemConfig> {
  const existing = await this.findOne({ key: configData.key.toUpperCase() });

  if (existing) {
    // Update existing
    if (updatedBy && updatedByEmail) {
      existing.changeHistory.push({
        value: existing.value,
        updatedBy: updatedBy as Types.ObjectId,
        updatedByEmail,
        updatedAt: new Date(),
        reason: "Configuration updated",
      });
      existing.lastUpdatedBy = updatedBy as Types.ObjectId;
      existing.lastUpdatedByEmail = updatedByEmail;
      existing.lastUpdatedAt = new Date();
    }

    Object.assign(existing, configData);
    await existing.save();
    return existing;
  } else {
    // Create new
    return this.create({
      ...configData,
      key: configData.key.toUpperCase(),
      lastUpdatedBy: updatedBy,
      lastUpdatedByEmail: updatedByEmail,
      lastUpdatedAt: updatedBy ? new Date() : undefined,
      changeHistory: [],
    });
  }
};

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Get change history for this configuration
 */
SystemConfigSchema.methods.getHistory = function (
  limit: number = 20
): IConfigChange[] {
  return this.changeHistory
    .sort(
      (a: ISystemConfig, b: ISystemConfig) =>
        b.updatedAt.getTime() - a.updatedAt.getTime()
    )
    .slice(0, limit);
};

/**
 * Validate a new value against rules
 */
SystemConfigSchema.methods.validateValue = function (value: any): {
  valid: boolean;
  error?: string;
} {
  if (!this.validation) {
    return { valid: true };
  }

  const rules = this.validation;

  // Type check
  if (this.dataType === "number" && typeof value !== "number") {
    return { valid: false, error: "Value must be a number" };
  }
  if (this.dataType === "string" && typeof value !== "string") {
    return { valid: false, error: "Value must be a string" };
  }
  if (this.dataType === "boolean" && typeof value !== "boolean") {
    return { valid: false, error: "Value must be a boolean" };
  }

  // Min/Max validation
  if (this.dataType === "number" && typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      return { valid: false, error: `Value must be at least ${rules.min}` };
    }
    if (rules.max !== undefined && value > rules.max) {
      return { valid: false, error: `Value must be at most ${rules.max}` };
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    return {
      valid: false,
      error: `Value must be one of: ${rules.enum.join(", ")}`,
    };
  }

  // Required validation
  if (rules.required && (value === null || value === undefined)) {
    return { valid: false, error: "Value is required" };
  }

  return { valid: true };
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

interface ISystemConfigModel extends Model<ISystemConfig> {
  getValue(key: string, defaultValue?: any): Promise<any>;
  setValue(
    key: string,
    value: any,
    updatedBy: Types.ObjectId | string,
    updatedByEmail: string,
    reason?: string
  ): Promise<ISystemConfig | null>;
  getByCategory(category: ConfigCategory): Promise<ISystemConfig[]>;
  resetToDefault(
    key: string,
    updatedBy: Types.ObjectId | string,
    updatedByEmail: string,
    reason?: string
  ): Promise<ISystemConfig | null>;
  getMany(keys: string[]): Promise<Record<string, any>>;
  upsert(
    configData: any,
    updatedBy?: Types.ObjectId | string,
    updatedByEmail?: string
  ): Promise<ISystemConfig>;
}

const SystemConfig =
  (mongoose.models.SystemConfig as ISystemConfigModel) ||
  mongoose.model<ISystemConfig, ISystemConfigModel>(
    "SystemConfig",
    SystemConfigSchema
  );

export default SystemConfig;
