// server/models/Transaction.ts
// Purpose: Transaction Model with FIXED TransactionType enum including gold_purchase and gold_sale

import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ✅ FIXED: Added "gold_purchase" and "gold_sale" to match action files
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "buy_gold"
  | "sell_gold"
  | "gold_purchase"  // ✅ FIXED: Added for action compatibility
  | "gold_sale"      // ✅ FIXED: Added for action compatibility
  | "physical_delivery";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentMethod =
  | "bank_transfer"
  | "credit_card"
  | "debit_card"
  | "wire_transfer"
  | "crypto";

export interface ITransaction extends Document {
  _id: Types.ObjectId;

  userId: Types.ObjectId;
  walletId: Types.ObjectId;

  type: TransactionType;
  status: TransactionStatus;

  amount: number;
  currency: string;
  fee: number;
  netAmount: number;

  goldAmount?: number;
  goldPricePerGram?: number;

  paymentMethod?: PaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;

  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  trackingNumber?: string;

  statusHistory: {
    status: TransactionStatus;
    timestamp: Date;
    note?: string;
  }[];

  errorMessage?: string;
  errorCode?: string;

  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;

  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  markAsCompleted(note?: string): Promise<void>;
  markAsFailed(error: string, code?: string): Promise<void>;
  markAsCancelled(reason?: string): Promise<void>;
  markAsRefunded(reason?: string): Promise<void>;
  addStatusUpdate(status: TransactionStatus, note?: string): Promise<void>;
}

export interface ITransactionModel extends Model<ITransaction> {
  findByUserId(
    userId: string | Types.ObjectId,
    limit?: number
  ): Promise<ITransaction[]>;
  findByWalletId(
    walletId: string | Types.ObjectId,
    limit?: number
  ): Promise<ITransaction[]>;
  findPendingTransactions(): Promise<ITransaction[]>;
  getUserStats(userId: string | Types.ObjectId): Promise<any>;
}

// Subdocument Schemas
const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    note: String,
  },
  { _id: false }
);

const DeliveryAddressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

// Main Schema
const TransactionSchema = new Schema<ITransaction, ITransactionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    // ✅ FIXED: Added "gold_purchase" and "gold_sale"
    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "buy_gold",
        "sell_gold",
        "gold_purchase",
        "gold_sale",
        "physical_delivery",
      ],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "EGP", "AED", "SAR"],
      required: true,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    goldAmount: {
      type: Number,
      min: 0,
    },

    goldPricePerGram: {
      type: Number,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "bank_transfer",
        "credit_card",
        "debit_card",
        "wire_transfer",
        "crypto",
      ],
    },

    paymentProvider: String,
    paymentReference: String,

    deliveryAddress: DeliveryAddressSchema,
    trackingNumber: String,

    statusHistory: {
      type: [StatusHistorySchema],
      default: function (this: ITransaction) {
        return [
          {
            status: this.status || "pending",
            timestamp: new Date(),
          },
        ];
      },
    },

    errorMessage: String,
    errorCode: String,

    description: {
      type: String,
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: String,
    userAgent: String,

    completedAt: Date,
    failedAt: Date,
    refundedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });

// Middleware
TransactionSchema.pre("save", function (next) {
  if (this.isModified("amount") || this.isModified("fee")) {
    this.netAmount = this.amount - this.fee;
  }
  next();
});

// Instance Methods
TransactionSchema.methods.markAsCompleted = async function (
  note?: string
): Promise<void> {
  this.status = "completed";
  this.completedAt = new Date();
  await this.addStatusUpdate("completed", note);
  await this.save();
};

TransactionSchema.methods.markAsFailed = async function (
  error: string,
  code?: string
): Promise<void> {
  this.status = "failed";
  this.failedAt = new Date();
  this.errorMessage = error;
  this.errorCode = code;
  await this.addStatusUpdate("failed", error);
  await this.save();
};

TransactionSchema.methods.markAsCancelled = async function (
  reason?: string
): Promise<void> {
  this.status = "cancelled";
  await this.addStatusUpdate("cancelled", reason);
  await this.save();
};

TransactionSchema.methods.markAsRefunded = async function (
  reason?: string
): Promise<void> {
  this.status = "refunded";
  this.refundedAt = new Date();
  await this.addStatusUpdate("refunded", reason);
  await this.save();
};

TransactionSchema.methods.addStatusUpdate = async function (
  status: TransactionStatus,
  note?: string
): Promise<void> {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  });
};

// Static Methods
TransactionSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId,
  limit: number = 50
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

TransactionSchema.statics.findByWalletId = function (
  walletId: string | Types.ObjectId,
  limit: number = 50
) {
  return this.find({ walletId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

TransactionSchema.statics.findPendingTransactions = function () {
  return this.find({ status: "pending" }).sort({ createdAt: 1 });
};

TransactionSchema.statics.getUserStats = async function (
  userId: string | Types.ObjectId
) {
  const transactions = await this.find({ userId });
  
  const stats = {
    totalTransactions: transactions.length,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalGoldPurchases: 0,
    totalGoldSales: 0,
  };

  transactions.forEach((tx) => {
    const amount = tx.amount || 0;
    if (tx.type === "deposit") stats.totalDeposits += amount;
    if (tx.type === "withdrawal") stats.totalWithdrawals += amount;
    // ✅ FIXED: Now both buy_gold and gold_purchase work
    if (tx.type === "buy_gold" || tx.type === "gold_purchase") {
      stats.totalGoldPurchases += amount;
    }
    if (tx.type === "sell_gold" || tx.type === "gold_sale") {
      stats.totalGoldSales += amount;
    }
  });

  return stats;
};

const Transaction = (mongoose.models.Transaction as ITransactionModel) || 
  mongoose.model<ITransaction, ITransactionModel>("Transaction", TransactionSchema);

export default Transaction;
