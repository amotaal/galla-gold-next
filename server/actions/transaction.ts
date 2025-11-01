// /server/actions/transaction.ts
// Transaction management server actions - CORRECTED VERSION
// Purpose: Handles transaction queries and operations with proper serialization
// FIX: All data properly serialized + removed non-existent bankAccount field

"use server";

import { requireAuth } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import Transaction from "@/server/models/Transaction";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// ============================================================================
// HELPER FUNCTION - SERIALIZE DATA
// ============================================================================

/**
 * Serialize MongoDB documents to plain objects
 * This prevents "Objects with toJSON methods" errors in Next.js
 * 
 * @param data - Any data that might contain MongoDB documents or Date objects
 * @returns Plain object safe to pass to client components
 */
function serializeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Date objects - convert to ISO string
  if (data instanceof Date) {
    return data.toISOString() as any;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item)) as any;
  }

  // Handle objects
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serialized[key] = serializeData((data as any)[key]);
      }
    }
    return serialized;
  }

  // Return primitive values as-is
  return data;
}

// ============================================================================
// GET TRANSACTIONS ACTION - FIXED
// ============================================================================

/**
 * Get user's transaction history
 * @param limit - Optional limit on number of transactions
 * @returns ActionResponse with transactions array (properly serialized)
 * 
 * FIX: All data is now properly serialized before returning
 * FIX: Removed bankAccount field (doesn't exist in Transaction model)
 */
export async function getTransactionsAction(
  limit?: number
): Promise<
  ActionResponse<{
    transactions: any[];
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    // Query transactions with .lean() for plain objects
    let query = Transaction.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean(); // Returns plain objects instead of Mongoose documents

    if (limit) {
      query = query.limit(limit);
    }

    const transactions = await query.exec();

    // Serialize all transactions (convert Dates to strings, remove toJSON methods)
    // ✅ FIXED: Removed bankAccount field - doesn't exist in Transaction model
    const serializedTransactions = transactions.map(tx => ({
      id: tx._id.toString(),
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      goldAmount: tx.goldAmount,
      goldPricePerGram: tx.goldPricePerGram,
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : null,
      completedAt: tx.completedAt ? new Date(tx.completedAt).toISOString() : null,
      description: tx.description,
      paymentMethod: tx.paymentMethod,
      metadata: tx.metadata, // bankAccount would be stored here if needed
    }));

    return {
      success: true,
      data: {
        transactions: serializedTransactions,
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

// ============================================================================
// GET TRANSACTION BY ID ACTION
// ============================================================================

/**
 * Get a specific transaction by ID
 * @param transactionId - Transaction ID
 * @returns ActionResponse with transaction details (properly serialized)
 * 
 * ✅ FIXED: Removed bankAccount field
 */
export async function getTransactionByIdAction(
  transactionId: string
): Promise<ActionResponse<{ transaction: any }>> {
  try {
    const session = await requireAuth();
    await connectDB();

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: session.user.id,
    }).lean(); // Use .lean() for plain object

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Serialize transaction
    // ✅ FIXED: Removed bankAccount field - doesn't exist in Transaction model
    const serializedTransaction = {
      id: transaction._id.toString(),
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      goldAmount: transaction.goldAmount,
      goldPricePerGram: transaction.goldPricePerGram,
      createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : null,
      completedAt: transaction.completedAt ? new Date(transaction.completedAt).toISOString() : null,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod,
      metadata: transaction.metadata, // bankAccount would be stored here if needed
    };

    return {
      success: true,
      data: {
        transaction: serializedTransaction,
      },
    };
  } catch (error: any) {
    console.error("Get transaction by ID error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch transaction",
    };
  }
}

// ============================================================================
// GET TRANSACTION STATISTICS
// ============================================================================

/**
 * Get transaction statistics for the user
 * @returns ActionResponse with statistics
 */
export async function getTransactionStatsAction(): Promise<
  ActionResponse<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalGoldPurchases: number;
    totalGoldSales: number;
    totalTransactions: number;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const transactions = await Transaction.find({ userId: session.user.id }).lean();

    const stats = {
      totalDeposits: transactions.filter(tx => tx.type === "deposit").length,
      totalWithdrawals: transactions.filter(tx => tx.type === "withdrawal").length,
      totalGoldPurchases: transactions.filter(tx => tx.type === "buy_gold" || tx.type === "gold_purchase").length,
      totalGoldSales: transactions.filter(tx => tx.type === "sell_gold" || tx.type === "gold_sale").length,
      totalTransactions: transactions.length,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error("Get transaction stats error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch transaction statistics",
    };
  }
}

// ============================================================================
// CANCEL TRANSACTION ACTION
// ============================================================================

/**
 * Cancel a pending transaction
 * @param transactionId - Transaction ID
 * @returns ActionResponse
 */
export async function cancelTransactionAction(
  transactionId: string
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();
    await connectDB();

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: session.user.id,
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Can only cancel pending transactions
    if (transaction.status !== "pending") {
      return {
        success: false,
        error: "Only pending transactions can be cancelled",
      };
    }

    transaction.status = "cancelled";
    await transaction.save();

    return {
      success: true,
      message: "Transaction cancelled successfully",
    };
  } catch (error: any) {
    console.error("Cancel transaction error:", error);

    return {
      success: false,
      error: error.message || "Failed to cancel transaction",
    };
  }
}
