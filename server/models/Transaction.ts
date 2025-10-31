// /server/models/Transaction.ts
// Transaction Model for GALLA.GOLD Application
// Purpose: Record all financial transactions including deposits, withdrawals, and gold trades
// Provides complete audit trail and transaction history for users

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Transaction types supported by the platform
 */
export type TransactionType =
  | 'deposit'            // Add cash to wallet
  | 'withdrawal'         // Withdraw cash from wallet
  | 'buy_gold'           // Purchase gold with cash
  | 'sell_gold'          // Sell gold for cash
  | 'physical_delivery'; // Request physical gold delivery

/**
 * Transaction status states
 */
export type TransactionStatus =
  | 'pending'    // Initiated but not processed
  | 'processing' // Being processed by payment provider
  | 'completed'  // Successfully completed
  | 'failed'     // Failed due to error
  | 'cancelled'  // Cancelled by user or system
  | 'refunded';  // Refunded to user

/**
 * Payment methods for deposits/withdrawals
 */
export type PaymentMethod =
  | 'bank_transfer'
  | 'credit_card'
  | 'debit_card'
  | 'wire_transfer'
  | 'crypto';

/**
 * Transaction document interface
 */
export interface ITransaction extends Document {
  userId: Types.ObjectId; // Reference to User model
  walletId: Types.ObjectId; // Reference to Wallet model
  
  // Transaction details
  type: TransactionType;
  status: TransactionStatus;
  
  // Amount details
  amount: number; // Transaction amount
  currency: string; // Currency code (USD, EUR, etc.)
  fee: number; // Transaction fee
  netAmount: number; // Amount after fees
  
  // Gold-specific fields (for gold trades)
  goldAmount?: number; // Amount of gold in grams
  goldPricePerGram?: number; // Gold price at time of transaction
  
  // Payment details
  paymentMethod?: PaymentMethod;
  paymentProvider?: string; // Stripe, PayPal, etc.
  paymentReference?: string; // External payment reference ID
  
  // Delivery details (for physical gold delivery)
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  trackingNumber?: string; // Shipping tracking number
  
  // Status details
  statusHistory: {
    status: TransactionStatus;
    timestamp: Date;
    note?: string;
  }[];
  
  // Error handling
  errorMessage?: string;
  errorCode?: string;
  
  // Metadata
  description: string; // Human-readable description
  metadata?: Record<string, any>; // Additional data
  ipAddress?: string; // User's IP address
  userAgent?: string; // User's browser/device info
  
  // Timestamps
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsCompleted(note?: string): Promise<void>;
  markAsFailed(error: string, code?: string): Promise<void>;
  markAsCancelled(reason?: string): Promise<void>;
  markAsRefunded(reason?: string): Promise<void>;
  addStatusUpdate(status: TransactionStatus, note?: string): Promise<void>;
}

/**
 * Transaction model interface with static methods
 */
export interface ITransactionModel extends Model<ITransaction> {
  findByUserId(userId: string | Types.ObjectId, limit?: number): Promise<ITransaction[]>;
  findByWalletId(walletId: string | Types.ObjectId, limit?: number): Promise<ITransaction[]>;
  findPendingTransactions(): Promise<ITransaction[]>;
  getUserStats(userId: string | Types.ObjectId): Promise<any>;
}

// =============================================================================
// SUBDOCUMENT SCHEMAS
// =============================================================================

/**
 * Status history subdocument schema
 */
const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
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

/**
 * Delivery address subdocument schema
 */
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

// =============================================================================
// MAIN SCHEMA DEFINITION
// =============================================================================

const TransactionSchema = new Schema<ITransaction, ITransactionModel>(
  {
    // -------------------------------------------------------------------------
    // REFERENCES
    // -------------------------------------------------------------------------
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // TRANSACTION DETAILS
    // -------------------------------------------------------------------------
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'buy_gold', 'sell_gold', 'physical_delivery'],
      required: true,
      index: true,
    },
    
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      required: true,
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // AMOUNT DETAILS
    // -------------------------------------------------------------------------
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'EGP', 'AED', 'SAR'],
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
    
    // -------------------------------------------------------------------------
    // GOLD TRADING FIELDS
    // -------------------------------------------------------------------------
    goldAmount: {
      type: Number,
      min: 0,
    },
    
    goldPricePerGram: {
      type: Number,
      min: 0,
    },
    
    // -------------------------------------------------------------------------
    // PAYMENT DETAILS
    // -------------------------------------------------------------------------
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'debit_card', 'wire_transfer', 'crypto'],
    },
    
    paymentProvider: String,
    paymentReference: String,
    
    // -------------------------------------------------------------------------
    // DELIVERY DETAILS (for physical gold)
    // -------------------------------------------------------------------------
    deliveryAddress: DeliveryAddressSchema,
    trackingNumber: String,
    
    // -------------------------------------------------------------------------
    // STATUS TRACKING
    // -------------------------------------------------------------------------
    statusHistory: {
      type: [StatusHistorySchema],
      default: function(this: ITransaction) {
        return [{
          status: this.status || 'pending',
          timestamp: new Date(),
        }];
      },
    },
    
    // -------------------------------------------------------------------------
    // ERROR HANDLING
    // -------------------------------------------------------------------------
    errorMessage: String,
    errorCode: String,
    
    // -------------------------------------------------------------------------
    // METADATA
    // -------------------------------------------------------------------------
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
    
    // -------------------------------------------------------------------------
    // STATUS TIMESTAMPS
    // -------------------------------------------------------------------------
    completedAt: Date,
    failedAt: Date,
    refundedAt: Date,
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INDEXES FOR PERFORMANCE
// =============================================================================

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Calculate net amount before saving
 */
TransactionSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('fee')) {
    this.netAmount = this.amount - this.fee;
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Mark transaction as completed
 * @param note - Optional completion note
 */
TransactionSchema.methods.markAsCompleted = async function (note?: string): Promise<void> {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.addStatusUpdate('completed', note);
  await this.save();
};

/**
 * Mark transaction as failed
 * @param error - Error message
 * @param code - Optional error code
 */
TransactionSchema.methods.markAsFailed = async function (
  error: string,
  code?: string
): Promise<void> {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorMessage = error;
  this.errorCode = code;
  await this.addStatusUpdate('failed', error);
  await this.save();
};

/**
 * Mark transaction as cancelled
 * @param reason - Cancellation reason
 */
TransactionSchema.methods.markAsCancelled = async function (reason?: string): Promise<void> {
  this.status = 'cancelled';
  await this.addStatusUpdate('cancelled', reason);
  await this.save();
};

/**
 * Mark transaction as refunded
 * @param reason - Refund reason
 */
TransactionSchema.methods.markAsRefunded = async function (reason?: string): Promise<void> {
  this.status = 'refunded';
  this.refundedAt = new Date();
  await this.addStatusUpdate('refunded', reason);
  await this.save();
};

/**
 * Add status update to history
 * @param status - New status
 * @param note - Optional note
 */
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

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find transactions by user ID
 * @param userId - User ID
 * @param limit - Optional limit (default: 50)
 * @returns Promise<ITransaction[]>
 */
TransactionSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId,
  limit: number = 50
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

/**
 * Find transactions by wallet ID
 * @param walletId - Wallet ID
 * @param limit - Optional limit (default: 50)
 * @returns Promise<ITransaction[]>
 */
TransactionSchema.statics.findByWalletId = function (
  walletId: string | Types.ObjectId,
  limit: number = 50
) {
  return this.find({ walletId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

/**
 * Find all pending transactions
 * @returns Promise<ITransaction[]>
 */
TransactionSchema.statics.findPendingTransactions = function () {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .exec();
};

/**
 * Get user transaction statistics
 * @param userId - User ID
 * @returns Promise<any> - Statistics object
 */
TransactionSchema.statics.getUserStats = async function (
  userId: string | Types.ObjectId
) {
  const stats = await this.aggregate([
    { $match: { userId: new Types.ObjectId(userId as string) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fee' },
      },
    },
  ]);
  
  return stats;
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

const Transaction = (mongoose.models.Transaction as ITransactionModel) ||
                    mongoose.model<ITransaction, ITransactionModel>('Transaction', TransactionSchema);

export default Transaction;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * CREATE DEPOSIT TRANSACTION:
 * 
 * const transaction = await Transaction.create({
 *   userId: user._id,
 *   walletId: wallet._id,
 *   type: 'deposit',
 *   amount: 1000,
 *   currency: 'USD',
 *   fee: 10,
 *   netAmount: 990,
 *   paymentMethod: 'bank_transfer',
 *   description: 'Deposit via bank transfer',
 * });
 * 
 * 
 * CREATE GOLD PURCHASE:
 * 
 * const transaction = await Transaction.create({
 *   userId: user._id,
 *   walletId: wallet._id,
 *   type: 'buy_gold',
 *   amount: 650,
 *   currency: 'USD',
 *   fee: 13,
 *   netAmount: 637,
 *   goldAmount: 10,
 *   goldPricePerGram: 65,
 *   description: 'Purchased 10g gold at $65/g',
 * });
 * 
 * 
 * UPDATE TRANSACTION STATUS:
 * 
 * await transaction.markAsCompleted('Payment processed successfully');
 * await transaction.markAsFailed('Insufficient funds', 'E001');
 * 
 * 
 * GET USER TRANSACTIONS:
 * 
 * const transactions = await Transaction.findByUserId(userId, 20);
 * 
 * 
 * GET USER STATISTICS:
 * 
 * const stats = await Transaction.getUserStats(userId);
 */
