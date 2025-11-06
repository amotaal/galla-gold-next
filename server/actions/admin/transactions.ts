// server/actions/admin/transactions.ts
// Purpose: Admin Transaction Management Actions
// Monitor, flag, and manage all platform transactions
// Includes fraud detection, refunds, and comprehensive transaction analytics

"use server";

import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import Transaction from "@/server/models/Transaction";
import Wallet from "@/server/models/Wallet";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { auditTransactionAction } from "@/server/lib/audit";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const transactionFiltersSchema = z.object({
  userId: z.string().optional(),
  type: z
    .enum([
      "deposit",
      "withdrawal",
      "gold_purchase",
      "gold_sale",
      "physical_delivery",
    ])
    .optional(),
  status: z
    .enum([
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "refunded",
    ])
    .optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  currency: z.enum(["USD", "EUR", "GBP", "EGP", "AED", "SAR"]).optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),
  flagged: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  skip: z.number().min(0).default(0),
  sortBy: z.enum(["createdAt", "amount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function verifyTransactionPermission(
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
// TRANSACTION LISTING & SEARCH
// =============================================================================

/**
 * Get transactions with filters
 * Permission: TRANSACTION_VIEW
 */
export async function getTransactions(
  adminId: string,
  filters: Partial<z.infer<typeof transactionFiltersSchema>> = {}
): Promise<{
  success: boolean;
  data?: {
    transactions: any[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_VIEW
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    const validated = transactionFiltersSchema.parse(filters);

    await dbConnect();

    // Build query
    const query: any = {};

    if (validated.userId) query.userId = validated.userId;
    if (validated.type) query.type = validated.type;
    if (validated.status) query.status = validated.status;
    if (validated.currency) query.currency = validated.currency;
    if (validated.flagged !== undefined) query.flagged = validated.flagged;

    if (validated.minAmount || validated.maxAmount) {
      query.amount = {};
      if (validated.minAmount) query.amount.$gte = validated.minAmount;
      if (validated.maxAmount) query.amount.$lte = validated.maxAmount;
    }

    if (validated.startDate || validated.endDate) {
      query.createdAt = {};
      if (validated.startDate)
        query.createdAt.$gte = new Date(validated.startDate);
      if (validated.endDate) query.createdAt.$lte = new Date(validated.endDate);
    }

    // Execute query
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "firstName lastName email")
        .sort({ [validated.sortBy]: validated.sortOrder === "asc" ? 1 : -1 })
        .limit(validated.limit)
        .skip(validated.skip)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        transactions,
        total,
        page: Math.floor(validated.skip / validated.limit) + 1,
        totalPages: Math.ceil(total / validated.limit),
      },
    };
  } catch (error: any) {
    console.error("Get transactions error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transactions",
    };
  }
}

/**
 * Alias for searchTransactions - for page compatibility
 */
export async function searchTransactions(adminId: string, filters: any) {
  return getTransactions(adminId, filters);
}

/**
 * Get transaction details
 * Permission: TRANSACTION_VIEW
 */
export async function getTransactionDetails(
  adminId: string,
  transactionId: string
): Promise<{
  success: boolean;
  data?: {
    transaction: any;
    user: any;
    relatedTransactions: any[];
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_VIEW
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(transactionId)
      .populate("userId", "firstName lastName email phone")
      .lean();

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Get user details
    const user = await User.findById(transaction.userId)
      .select("-password -mfaSecret -mfaBackupCodes")
      .lean();

    // Get related transactions (same user, same day)
    const dayStart = new Date(transaction.createdAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(transaction.createdAt);
    dayEnd.setHours(23, 59, 59, 999);

    const relatedTransactions = await Transaction.find({
      userId: transaction.userId,
      _id: { $ne: transactionId },
      createdAt: { $gte: dayStart, $lte: dayEnd },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      success: true,
      data: {
        transaction,
        user,
        relatedTransactions,
      },
    };
  } catch (error: any) {
    console.error("Get transaction details error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction details",
    };
  }
}

// =============================================================================
// TRANSACTION STATISTICS
// =============================================================================

/**
 * Get transaction statistics for dashboard
 * Permission: TRANSACTION_VIEW
 */
export async function getTransactionStats(adminId: string): Promise<{
  success: boolean;
  data?: {
    totalTransactions: number;
    totalVolume: number;
    todayTransactions: number;
    todayVolume: number;
    pendingTransactions: number;
    failedTransactions: number;
    flaggedTransactions: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_VIEW
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalTransactions,
      volumeAgg,
      todayTransactions,
      todayVolumeAgg,
      pendingTransactions,
      failedTransactions,
      flaggedTransactions,
      byTypeAgg,
      byStatusAgg,
    ] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({ createdAt: { $gte: todayStart } }),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({ status: "pending" }),
      Transaction.countDocuments({ status: "failed" }),
      Transaction.countDocuments({ flagged: true }),
      Transaction.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Transaction.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    // Format aggregation results
    const byType: Record<string, number> = {};
    byTypeAgg.forEach((item: any) => {
      byType[item._id] = item.count;
    });

    const byStatus: Record<string, number> = {};
    byStatusAgg.forEach((item: any) => {
      byStatus[item._id] = item.count;
    });

    return {
      success: true,
      data: {
        totalTransactions,
        totalVolume: volumeAgg[0]?.total || 0,
        todayTransactions,
        todayVolume: todayVolumeAgg[0]?.total || 0,
        pendingTransactions,
        failedTransactions,
        flaggedTransactions,
        byType,
        byStatus,
      },
    };
  } catch (error: any) {
    console.error("Get transaction stats error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction statistics",
    };
  }
}

// =============================================================================
// TRANSACTION MANAGEMENT
// =============================================================================

/**
 * Flag transaction as suspicious
 * Permission: TRANSACTION_FLAG
 */
export async function flagTransaction(
  adminId: string,
  transactionId: string,
  reason: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!reason || reason.length < 10) {
      return {
        success: false,
        error: "Flag reason must be at least 10 characters",
      };
    }

    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_FLAG
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Flag transaction
    transaction.flagged = true;
    transaction.flagReason = reason;
    transaction.flaggedBy = adminId;
    transaction.flaggedAt = new Date();
    await transaction.save();

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "flag",
      transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason,
    });

    return {
      success: true,
      data: {
        message: "Transaction flagged successfully",
      },
    };
  } catch (error: any) {
    console.error("Flag transaction error:", error);
    return {
      success: false,
      error: error.message || "Failed to flag transaction",
    };
  }
}

/**
 * Unflag transaction
 * Permission: TRANSACTION_FLAG
 */
export async function unflagTransaction(
  adminId: string,
  transactionId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_FLAG
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Unflag transaction
    transaction.flagged = false;
    transaction.flagReason = undefined;
    transaction.flaggedBy = undefined;
    transaction.flaggedAt = undefined;
    await transaction.save();

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "unflag",
      transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason: reason || "Transaction cleared",
    });

    return {
      success: true,
      data: {
        message: "Transaction unflagged successfully",
      },
    };
  } catch (error: any) {
    console.error("Unflag transaction error:", error);
    return {
      success: false,
      error: error.message || "Failed to unflag transaction",
    };
  }
}

/**
 * Cancel pending transaction
 * Permission: TRANSACTION_CANCEL
 */
export async function cancelTransaction(
  adminId: string,
  transactionId: string,
  reason: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!reason || reason.length < 10) {
      return {
        success: false,
        error: "Cancellation reason must be at least 10 characters",
      };
    }

    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_CANCEL
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (transaction.status === "completed") {
      return {
        success: false,
        error: "Cannot cancel completed transaction. Use refund instead.",
      };
    }

    if (transaction.status === "cancelled") {
      return { success: false, error: "Transaction already cancelled" };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Cancel transaction
    transaction.status = "cancelled";
    transaction.cancelReason = reason;
    transaction.cancelledBy = adminId;
    transaction.cancelledAt = new Date();
    await transaction.save();

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "cancel",
      transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason,
    });

    return {
      success: true,
      data: {
        message: "Transaction cancelled successfully",
      },
    };
  } catch (error: any) {
    console.error("Cancel transaction error:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel transaction",
    };
  }
}

/**
 * Process refund for completed transaction
 * Permission: TRANSACTION_REFUND
 */
export async function refundTransaction(
  adminId: string,
  transactionId: string,
  reason: string,
  amount?: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!reason || reason.length < 10) {
      return {
        success: false,
        error: "Refund reason must be at least 10 characters",
      };
    }

    const permCheck = await verifyTransactionPermission(
      adminId,
      PERMISSIONS.TRANSACTION_REFUND
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (transaction.status !== "completed") {
      return {
        success: false,
        error: "Only completed transactions can be refunded",
      };
    }

    if (
      transaction.status === "completed" ||
      transaction.status === "refunded"
    ) {
      return { success: false, error: "Transaction already refunded" };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const refundAmount = amount || transaction.amount;

    if (refundAmount > transaction.amount) {
      return {
        success: false,
        error: "Refund amount cannot exceed transaction amount",
      };
    }

    // Get user wallet
    const wallet = await Wallet.findOne({ userId: transaction.userId });
    if (!wallet) {
      return { success: false, error: "User wallet not found" };
    }

    // Process refund based on transaction type
    if (
      transaction.type === "gold_purchase" ||
      transaction.type === "buy_gold"
    ) {
      // Refund gold purchase: return money, deduct gold
      const goldAmount = transaction.metadata?.grams || 0;
      if (wallet.gold.grams < goldAmount) {
        return {
          success: false,
          error: "User does not have enough gold to refund",
        };
      }
      wallet.balance[transaction.currency] += refundAmount;
      wallet.gold.grams -= goldAmount;
    } else if (
      transaction.type === "gold_sale" ||
      transaction.type === "sell_gold"
    ) {
      // Refund gold sale: return gold, deduct money
      const goldAmount = transaction.metadata?.grams || 0;
      if (wallet.balance[transaction.currency] < refundAmount) {
        return {
          success: false,
          error: "User does not have enough balance to refund",
        };
      }
      wallet.balance[transaction.currency] -= refundAmount;
      wallet.gold.grams += goldAmount;
    } else if (transaction.type === "deposit") {
      // Refund deposit: deduct from balance
      if (wallet.balance[transaction.currency] < refundAmount) {
        return {
          success: false,
          error: "User does not have enough balance to refund",
        };
      }
      wallet.balance[transaction.currency] -= refundAmount;
    } else if (transaction.type === "withdrawal") {
      // Refund withdrawal: add back to balance
      wallet.balance[transaction.currency] += refundAmount;
    }

    await wallet.save();

    // Update transaction
    transaction.status = "refunded";
    transaction.refundAmount = refundAmount;
    transaction.refundReason = reason;
    transaction.refundedBy = adminId;
    transaction.refundedAt = new Date();
    await transaction.save();

    // Create refund transaction record
    await Transaction.create({
      userId: transaction.userId,
      walletId: wallet._id,
      type: "refund",
      status: "completed",
      amount: refundAmount,
      currency: transaction.currency,
      fee: 0,
      netAmount: refundAmount,
      description: `Refund for transaction ${transactionId}`,
      metadata: {
        originalTransactionId: transactionId,
        refundReason: reason,
        refundedBy: adminId,
      },
    });

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "refund",
      transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason,
      notes: `Refund amount: ${refundAmount} ${transaction.currency}`,
    });

    return {
      success: true,
      data: {
        message: "Transaction refunded successfully",
        refundAmount,
      },
    };
  } catch (error: any) {
    console.error("Refund transaction error:", error);
    return {
      success: false,
      error: error.message || "Failed to refund transaction",
    };
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  getTransactions,
  getTransactionDetails,
  getTransactionStats,
  flagTransaction,
  unflagTransaction,
  cancelTransaction,
  refundTransaction,
};
