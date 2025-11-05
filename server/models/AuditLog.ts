// server/models/AuditLog.ts
// Purpose: Audit Log Model - Track all administrative actions for compliance and security
// This model records every action taken by administrators, operators, and auditors
// Required for regulatory compliance and security investigations

import mongoose, { Schema, Document, Model, Types } from "mongoose";

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

/**
 * Change tracking structure
 * Records the before/after state of modified resources
 */
interface IChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
}

/**
 * Metadata structure for additional context
 */
interface IMetadata {
  reason?: string;
  notes?: string;
  requestId?: string;
  duration?: number; // Action duration in milliseconds
  [key: string]: any;
}

/**
 * AuditLog Document Interface
 * Extends Mongoose Document with audit log fields
 */
export interface IAuditLog extends Document {
  _id: Types.ObjectId;

  // User who performed the action
  userId: Types.ObjectId;
  userEmail: string;
  userRole: "superadmin" | "admin" | "operator" | "auditor" | "user";

  // Action details
  action: string; // e.g., 'kyc.approve', 'user.suspend', 'config.update'
  category: "kyc" | "user" | "transaction" | "config" | "system" | "auth";
  description: string; // Human-readable description

  // Resource affected
  resource: string; // e.g., 'user', 'kyc', 'transaction', 'config'
  resourceId?: Types.ObjectId;
  resourceIdentifier?: string; // Human-readable identifier (email, transaction ID, etc.)

  // Changes made
  changes?: IChanges;
  metadata?: IMetadata;

  // Request details
  ipAddress: string;
  userAgent?: string;
  httpMethod?: string; // GET, POST, PUT, DELETE
  endpoint?: string; // API endpoint or page

  // Result
  status: "success" | "failure" | "partial";
  errorMessage?: string;
  errorCode?: string;

  // Timestamps
  timestamp: Date;
  createdAt: Date;
}

// =============================================================================
// MONGOOSE SCHEMA
// =============================================================================

const AuditLogSchema = new Schema<IAuditLog>(
  {
    // User information
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ["superadmin", "admin", "operator", "auditor", "user"],
      required: true,
      index: true,
    },

    // Action details
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'kyc.approve', 'user.suspend', 'config.update', 'transaction.flag'
    },
    category: {
      type: String,
      enum: ["kyc", "user", "transaction", "config", "system", "auth"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      // Human-readable description of what happened
    },

    // Resource information
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    resourceIdentifier: {
      type: String,
      index: true,
    },

    // Changes tracking
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Request details
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: String,
    httpMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    endpoint: String,

    // Result
    status: {
      type: String,
      enum: ["success", "failure", "partial"],
      required: true,
      default: "success",
      index: true,
    },
    errorMessage: String,
    errorCode: String,

    // Timestamp
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "auditlogs",
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // User's recent actions
AuditLogSchema.index({ action: 1, timestamp: -1 }); // Actions by type over time
AuditLogSchema.index({ category: 1, timestamp: -1 }); // Category-based queries
AuditLogSchema.index({ resourceId: 1, timestamp: -1 }); // Resource history
AuditLogSchema.index({ status: 1, timestamp: -1 }); // Failed actions
AuditLogSchema.index({ timestamp: -1 }); // Recent activity
AuditLogSchema.index({ userEmail: 1, timestamp: -1 }); // User email search

// TTL index - automatically delete logs older than 2 years (compliance requirement)
// Comment out or adjust based on your retention policy
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Static method to create an audit log entry
 * Simplifies the creation process with a clean API
 */
AuditLogSchema.statics.log = async function (
  params: {
    userId: Types.ObjectId | string;
    userEmail: string;
    userRole: "superadmin" | "admin" | "operator" | "auditor" | "user";
    action: string;
    category: "kyc" | "user" | "transaction" | "config" | "system" | "auth";
    description: string;
    resource: string;
    resourceId?: Types.ObjectId | string;
    resourceIdentifier?: string;
    changes?: IChanges;
    metadata?: IMetadata;
    ipAddress: string;
    userAgent?: string;
    httpMethod?: string;
    endpoint?: string;
    status?: "success" | "failure" | "partial";
    errorMessage?: string;
    errorCode?: string;
  }
): Promise<IAuditLog> {
  return this.create({
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
    metadata: params.metadata || {},
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    httpMethod: params.httpMethod,
    endpoint: params.endpoint,
    status: params.status || "success",
    errorMessage: params.errorMessage,
    errorCode: params.errorCode,
    timestamp: new Date(),
  });
};

/**
 * Get recent activity for a user
 */
AuditLogSchema.statics.getUserActivity = async function (
  userId: Types.ObjectId | string,
  limit: number = 50
): Promise<IAuditLog[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Get activity for a specific resource
 */
AuditLogSchema.statics.getResourceHistory = async function (
  resourceId: Types.ObjectId | string,
  limit: number = 50
): Promise<IAuditLog[]> {
  return this.find({ resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Search audit logs with filters
 */
AuditLogSchema.statics.search = async function (filters: {
  userId?: Types.ObjectId | string;
  userEmail?: string;
  action?: string;
  category?: string;
  resource?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}): Promise<{ logs: IAuditLog[]; total: number }> {
  const query: any = {};

  if (filters.userId) query.userId = filters.userId;
  if (filters.userEmail) {
    query.userEmail = new RegExp(filters.userEmail, "i");
  }
  if (filters.action) query.action = new RegExp(filters.action, "i");
  if (filters.category) query.category = filters.category;
  if (filters.resource) query.resource = filters.resource;
  if (filters.status) query.status = filters.status;

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = filters.startDate;
    if (filters.endDate) query.timestamp.$lte = filters.endDate;
  }

  const limit = filters.limit || 50;
  const skip = filters.skip || 0;

  const [logs, total] = await Promise.all([
    this.find(query).sort({ timestamp: -1 }).limit(limit).skip(skip).lean().exec(),
    this.countDocuments(query),
  ]);

  return { logs, total };
};

// =============================================================================
// INSTANCE METHODS
// =============================================================================

// Add any instance methods here if needed

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Pre-save middleware to ensure timestamp is set
AuditLogSchema.pre("save", function (next) {
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  next();
});

// =============================================================================
// MODEL EXPORT
// =============================================================================

// Extend the Model interface with static methods
interface IAuditLogModel extends Model<IAuditLog> {
  log(params: any): Promise<IAuditLog>;
  getUserActivity(userId: Types.ObjectId | string, limit?: number): Promise<IAuditLog[]>;
  getResourceHistory(resourceId: Types.ObjectId | string, limit?: number): Promise<IAuditLog[]>;
  search(filters: any): Promise<{ logs: IAuditLog[]; total: number }>;
}

const AuditLog =
  (mongoose.models.AuditLog as IAuditLogModel) ||
  mongoose.model<IAuditLog, IAuditLogModel>("AuditLog", AuditLogSchema);

export default AuditLog;
