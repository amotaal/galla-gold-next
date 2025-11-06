// server/models/SupportTicket.ts
// Purpose: Support Ticket Model - Customer support and help desk system
// Enables users to create support tickets and admins to manage and respond
// Phase 2 feature - foundation model for future implementation

import mongoose, { Schema, Document, Model, Types } from "mongoose";

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

/**
 * Ticket status lifecycle
 */
export type TicketStatus =
  | "open" // Newly created, awaiting triage
  | "assigned" // Assigned to an operator
  | "in_progress" // Being actively worked on
  | "waiting_customer" // Awaiting customer response
  | "waiting_internal" // Awaiting internal response
  | "resolved" // Issue resolved, awaiting closure
  | "closed" // Ticket closed
  | "reopened"; // Reopened after being closed

/**
 * Ticket priority levels
 */
export type TicketPriority =
  | "low" // Low priority, no urgency
  | "medium" // Standard priority
  | "high" // High priority, needs attention
  | "urgent" // Critical issue, immediate attention
  | "critical"; // System-critical, all-hands-on-deck

/**
 * Ticket categories for routing and organization
 */
export type TicketCategory =
  | "kyc" // KYC verification issues
  | "transaction" // Transaction problems
  | "account" // Account access or settings
  | "technical" // Technical bugs or errors
  | "billing" // Billing and payment issues
  | "security" // Security concerns
  | "feature_request" // Feature suggestions
  | "feedback" // General feedback
  | "other"; // Uncategorized

/**
 * Message in ticket conversation
 */
export interface ITicketMessage {
  _id?: Types.ObjectId;
  from: Types.ObjectId; // User or Admin who sent the message
  fromRole: "user" | "admin" | "operator" | "system";
  message: string;
  attachments?: IAttachment[];
  isInternal: boolean; // Internal notes not visible to customer
  timestamp: Date;
}

/**
 * Attachment structure
 */
export interface IAttachment {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Status change history entry
 */
export interface IStatusChange {
  from: TicketStatus;
  to: TicketStatus;
  changedBy: Types.ObjectId;
  changedByEmail: string;
  reason?: string;
  timestamp: Date;
}

/**
 * SupportTicket Document Interface
 */
export interface ISupportTicket extends Document {
  _id: Types.ObjectId;

  // Ticket identification
  ticketId: string; // Human-readable ID (e.g., "TKT-2024-00123")

  // User information
  userId: Types.ObjectId;
  userEmail: string;
  userName: string;

  // Ticket details
  subject: string;
  description: string;
  category: TicketCategory;
  subcategory?: string;

  // Status and priority
  status: TicketStatus;
  priority: TicketPriority;

  // Assignment
  assignedTo?: Types.ObjectId;
  assignedToEmail?: string;
  assignedAt?: Date;
  assignedBy?: Types.ObjectId;

  // Tags for organization
  tags?: string[];

  // Conversation
  messages: ITicketMessage[];
  lastMessageAt?: Date;
  lastMessageBy?: Types.ObjectId;

  // Status history
  statusHistory: IStatusChange[];

  // Resolution
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolutionNotes?: string;
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  closeReason?: string;

  // Customer satisfaction
  customerRating?: number; // 1-5 stars
  customerFeedback?: string;

  // SLA tracking
  responseDeadline?: Date; // When first response is due
  resolutionDeadline?: Date; // When resolution is due
  firstResponseAt?: Date;
  responseTime?: number; // Time to first response in minutes
  resolutionTime?: number; // Time to resolution in minutes

  // Related resources
  relatedTransactionId?: Types.ObjectId;
  relatedKycId?: Types.ObjectId;

  // Metadata
  source: "web" | "email" | "chat" | "phone" | "api";
  ipAddress?: string;
  userAgent?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// MONGOOSE SCHEMAS
// =============================================================================

const AttachmentSchema = new Schema<IAttachment>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const TicketMessageSchema = new Schema<ITicketMessage>({
  from: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromRole: {
    type: String,
    enum: ["user", "admin", "operator", "system"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [AttachmentSchema],
  isInternal: {
    type: Boolean,
    default: false,
    // Internal notes not visible to customer
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const StatusChangeSchema = new Schema<IStatusChange>(
  {
    from: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in_progress",
        "waiting_customer",
        "waiting_internal",
        "resolved",
        "closed",
        "reopened",
      ],
      required: true,
    },
    to: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in_progress",
        "waiting_customer",
        "waiting_internal",
        "resolved",
        "closed",
        "reopened",
      ],
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedByEmail: {
      type: String,
      required: true,
    },
    reason: String,
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    // Ticket identification
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },

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
    userName: {
      type: String,
      required: true,
    },

    // Ticket details
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: [
        "kyc",
        "transaction",
        "account",
        "technical",
        "billing",
        "security",
        "feature_request",
        "feedback",
        "other",
      ],
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },

    // Status and priority
    status: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in_progress",
        "waiting_customer",
        "waiting_internal",
        "resolved",
        "closed",
        "reopened",
      ],
      required: true,
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent", "critical"],
      required: true,
      default: "medium",
      index: true,
    },

    // Assignment
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedToEmail: String,
    assignedAt: Date,
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Tags
    tags: [String],

    // Conversation
    messages: {
      type: [TicketMessageSchema],
      default: [],
    },
    lastMessageAt: Date,
    lastMessageBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Status history
    statusHistory: {
      type: [StatusChangeSchema],
      default: [],
    },

    // Resolution
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNotes: String,
    closedAt: Date,
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    closeReason: String,

    // Customer satisfaction
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    customerFeedback: String,

    // SLA tracking
    responseDeadline: Date,
    resolutionDeadline: Date,
    firstResponseAt: Date,
    responseTime: Number, // minutes
    resolutionTime: Number, // minutes

    // Related resources
    relatedTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },
    relatedKycId: {
      type: Schema.Types.ObjectId,
      ref: "KYC",
    },

    // Metadata
    source: {
      type: String,
      enum: ["web", "email", "chat", "phone", "api"],
      required: true,
      default: "web",
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    collection: "supporttickets",
  }
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound indexes for common queries
SupportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 }); // Queue sorting
SupportTicketSchema.index({ userId: 1, status: 1 }); // User's tickets
SupportTicketSchema.index({ assignedTo: 1, status: 1 }); // Agent's tickets
SupportTicketSchema.index({ category: 1, status: 1 }); // Category filtering
SupportTicketSchema.index({ createdAt: -1 }); // Recent tickets
SupportTicketSchema.index({ responseDeadline: 1, status: 1 }); // SLA monitoring

// =============================================================================
// PRE-SAVE MIDDLEWARE
// =============================================================================

/**
 * Generate ticket ID on creation
 * Format: TKT-YYYY-XXXXX (e.g., TKT-2024-00123)
 */
SupportTicketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("SupportTicket").countDocuments({
      ticketId: new RegExp(`^TKT-${year}-`),
    });
    const ticketNumber = String(count + 1).padStart(5, "0");
    this.ticketId = `TKT-${year}-${ticketNumber}`;
  }
  next();
});

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Get open tickets queue sorted by priority and age
 */
SupportTicketSchema.statics.getQueue = async function (filters?: {
  status?: TicketStatus[];
  category?: TicketCategory;
  priority?: TicketPriority;
  assignedTo?: Types.ObjectId | string;
  limit?: number;
  skip?: number;
}): Promise<{ tickets: ISupportTicket[]; total: number }> {
  const query: any = {};

  if (filters?.status) {
    query.status = { $in: filters.status };
  } else {
    query.status = {
      $in: ["open", "assigned", "in_progress", "waiting_internal"],
    };
  }

  if (filters?.category) query.category = filters.category;
  if (filters?.priority) query.priority = filters.priority;
  if (filters?.assignedTo) query.assignedTo = filters.assignedTo;

  const limit = filters?.limit || 50;
  const skip = filters?.skip || 0;

  const [tickets, total] = await Promise.all([
    this.find(query)
      .sort({ priority: -1, createdAt: 1 }) // Urgent first, then oldest
      .limit(limit)
      .skip(skip)
      .populate("userId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .lean()
      .exec(),
    this.countDocuments(query),
  ]);

  return { tickets, total };
};

/**
 * Get user's tickets
 */
SupportTicketSchema.statics.getUserTickets = async function (
  userId: Types.ObjectId | string,
  includeResolved: boolean = false
): Promise<ISupportTicket[]> {
  const query: any = { userId };

  if (!includeResolved) {
    query.status = { $ne: "closed" };
  }

  return this.find(query).sort({ updatedAt: -1 }).lean().exec();
};

/**
 * Calculate SLA metrics for a ticket
 */
SupportTicketSchema.statics.calculateSLA = function (
  priority: TicketPriority,
  createdAt: Date
): { responseDeadline: Date; resolutionDeadline: Date } {
  const now = createdAt.getTime();

  // SLA in hours based on priority
  const sla = {
    critical: { response: 1, resolution: 4 },
    urgent: { response: 2, resolution: 8 },
    high: { response: 4, resolution: 24 },
    medium: { response: 8, resolution: 48 },
    low: { response: 24, resolution: 120 },
  };

  const times = sla[priority];

  return {
    responseDeadline: new Date(now + times.response * 60 * 60 * 1000),
    resolutionDeadline: new Date(now + times.resolution * 60 * 60 * 1000),
  };
};

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Add a message to the ticket
 */
SupportTicketSchema.methods.addMessage = async function (
  from: Types.ObjectId | string,
  fromRole: "user" | "admin" | "operator" | "system",
  message: string,
  isInternal: boolean = false,
  attachments?: IAttachment[]
): Promise<ISupportTicket> {
  this.messages.push({
    from: from as Types.ObjectId,
    fromRole,
    message,
    isInternal,
    attachments,
    timestamp: new Date(),
  });

  this.lastMessageAt = new Date();
  this.lastMessageBy = from as Types.ObjectId;

  // Set first response time if this is the first admin response
  if (fromRole !== "user" && !this.firstResponseAt) {
    this.firstResponseAt = new Date();
    this.responseTime = Math.floor(
      (this.firstResponseAt.getTime() - this.createdAt.getTime()) / 60000
    );
  }

  await this.save();
  return this as unknown as ISupportTicket;
};

/**
 * Change ticket status
 */
SupportTicketSchema.methods.changeStatus = async function (
  newStatus: TicketStatus,
  changedBy: Types.ObjectId | string,
  changedByEmail: string,
  reason?: string
): Promise<ISupportTicket> {
  const oldStatus = this.status;

  this.statusHistory.push({
    from: oldStatus,
    to: newStatus,
    changedBy: changedBy as Types.ObjectId,
    changedByEmail,
    reason,
    timestamp: new Date(),
  });

  this.status = newStatus;

  // Set resolution time if resolved
  if (newStatus === "resolved" && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.resolutionTime = Math.floor(
      (this.resolvedAt.getTime() - this.createdAt.getTime()) / 60000
    );
  }

  // Set closed time if closed
  if (newStatus === "closed" && !this.closedAt) {
    this.closedAt = new Date();
  }

  await this.save();
  return this as unknown as ISupportTicket;
};

/**
 * Assign ticket to operator
 */
SupportTicketSchema.methods.assign = async function (
  operatorId: Types.ObjectId | string,
  operatorEmail: string,
  assignedBy: Types.ObjectId | string
): Promise<ISupportTicket> {
  this.assignedTo = operatorId as Types.ObjectId;
  this.assignedToEmail = operatorEmail;
  this.assignedAt = new Date();
  this.assignedBy = assignedBy as Types.ObjectId;

  if (this.status === "open") {
    this.status = "assigned";
  }

  await this.save();
  return this as unknown as ISupportTicket;
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

interface ISupportTicketModel extends Model<ISupportTicket> {
  getQueue(
    filters?: any
  ): Promise<{ tickets: ISupportTicket[]; total: number }>;
  getUserTickets(
    userId: Types.ObjectId | string,
    includeResolved?: boolean
  ): Promise<ISupportTicket[]>;
  calculateSLA(priority: TicketPriority, createdAt: Date): any;
}

const SupportTicket =
  (mongoose.models.SupportTicket as ISupportTicketModel) ||
  mongoose.model<ISupportTicket, ISupportTicketModel>(
    "SupportTicket",
    SupportTicketSchema
  );

export default SupportTicket;
