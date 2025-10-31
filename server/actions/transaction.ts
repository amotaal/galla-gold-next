// /server/actions/transaction.ts
// Transaction management server actions
// Handles transaction history, details, export, and statistics

"use server";

import { requireAuth } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import Transaction from "@/server/models/Transaction";
import { convertCurrency, formatCurrency } from "@/server/lib/currency";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

type TransactionFilter = {
  type?: string;
  status?: string;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
};

// ============================================================================
// GET TRANSACTIONS ACTION
// ============================================================================

/**
 * Get user's transaction history with pagination and filtering
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 20)
 * @param filters - Optional filters
 * @returns ActionResponse with transactions and pagination data
 */
export async function getTransactionsAction(
  page: number = 1,
  limit: number = 20,
  filters?: TransactionFilter
): Promise<
  ActionResponse<{
    transactions: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    // Build query
    const query: any = { userId: session.user.id };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.currency) {
      query.currency = filters.currency;
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      query.amount = {};
      if (filters.minAmount !== undefined) {
        query.amount.$gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        query.amount.$lte = filters.maxAmount;
      }
    }

    // Get total count for pagination
    const totalItems = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Fetch transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx._id.toString(),
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt,
          metadata: tx.metadata,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
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
// GET SINGLE TRANSACTION ACTION
// ============================================================================

/**
 * Get details of a single transaction
 * @param transactionId - Transaction ID
 * @returns ActionResponse with transaction details
 */
export async function getTransactionAction(
  transactionId: string
): Promise<ActionResponse<any>> {
  try {
    const session = await requireAuth();
    await connectDB();

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: session.user.id, // Ensure user owns this transaction
    }).lean();

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    return {
      success: true,
      data: {
        id: transaction._id.toString(),
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        metadata: transaction.metadata,
      },
    };
  } catch (error: any) {
    console.error("Get transaction error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch transaction",
    };
  }
}

// ============================================================================
// GET TRANSACTION STATISTICS ACTION
// ============================================================================

/**
 * Get transaction statistics for the user
 * @param period - Time period ("month", "quarter", "year", "all")
 * @returns ActionResponse with statistics
 */
export async function getTransactionStatsAction(
  period: "month" | "quarter" | "year" | "all" = "month"
): Promise<
  ActionResponse<{
    summary: {
      totalTransactions: number;
      totalDeposits: number;
      totalWithdrawals: number;
      totalGoldPurchases: number;
      totalGoldSales: number;
    };
    byType: Record<string, { count: number; totalAmount: number }>;
    byStatus: Record<string, number>;
    byCurrency: Record<string, { count: number; totalAmount: number }>;
    recentActivity: Array<{
      date: Date;
      deposits: number;
      withdrawals: number;
      goldPurchases: number;
      goldSales: number;
    }>;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    // Calculate date range based on period
    const startDate = new Date();
    switch (period) {
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "all":
        startDate.setFullYear(2000); // Far past
        break;
    }

    // Fetch transactions in period
    const transactions = await Transaction.find({
      userId: session.user.id,
      createdAt: { $gte: startDate },
    }).lean();

    // Calculate summary statistics
    const summary = {
      totalTransactions: transactions.length,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalGoldPurchases: 0,
      totalGoldSales: 0,
    };

    const byType: Record<string, { count: number; totalAmount: number }> = {};
    const byStatus: Record<string, number> = {};
    const byCurrency: Record<string, { count: number; totalAmount: number }> = {};

    // Process each transaction
    for (const tx of transactions) {
      // Convert all amounts to USD for consistent totals
      const amountUSD = await convertCurrency(
        tx.amount,
        tx.currency as any,
        "USD"
      );

      // Summary by type
      if (tx.type === "deposit") summary.totalDeposits += amountUSD;
      if (tx.type === "withdrawal") summary.totalWithdrawals += amountUSD;
      if (tx.type === "gold_purchase") summary.totalGoldPurchases += amountUSD;
      if (tx.type === "gold_sale") summary.totalGoldSales += amountUSD;

      // By type
      if (!byType[tx.type]) {
        byType[tx.type] = { count: 0, totalAmount: 0 };
      }
      byType[tx.type].count++;
      byType[tx.type].totalAmount += amountUSD;

      // By status
      byStatus[tx.status] = (byStatus[tx.status] || 0) + 1;

      // By currency
      if (!byCurrency[tx.currency]) {
        byCurrency[tx.currency] = { count: 0, totalAmount: 0 };
      }
      byCurrency[tx.currency].count++;
      byCurrency[tx.currency].totalAmount += tx.amount;
    }

    // Calculate recent activity (last 7 days, daily breakdown)
    const recentActivity: Array<{
      date: Date;
      deposits: number;
      withdrawals: number;
      goldPurchases: number;
      goldSales: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTransactions = transactions.filter(
        (tx) =>
          tx.createdAt >= date &&
          tx.createdAt < nextDate &&
          tx.status === "completed"
      );

      const activity = {
        date,
        deposits: 0,
        withdrawals: 0,
        goldPurchases: 0,
        goldSales: 0,
      };

      for (const tx of dayTransactions) {
        const amountUSD = await convertCurrency(
          tx.amount,
          tx.currency as any,
          "USD"
        );

        if (tx.type === "deposit") activity.deposits += amountUSD;
        if (tx.type === "withdrawal") activity.withdrawals += amountUSD;
        if (tx.type === "gold_purchase") activity.goldPurchases += amountUSD;
        if (tx.type === "gold_sale") activity.goldSales += amountUSD;
      }

      recentActivity.push(activity);
    }

    // Round all amounts to 2 decimal places
    summary.totalDeposits = Math.round(summary.totalDeposits * 100) / 100;
    summary.totalWithdrawals = Math.round(summary.totalWithdrawals * 100) / 100;
    summary.totalGoldPurchases = Math.round(summary.totalGoldPurchases * 100) / 100;
    summary.totalGoldSales = Math.round(summary.totalGoldSales * 100) / 100;

    Object.keys(byType).forEach((key) => {
      byType[key].totalAmount = Math.round(byType[key].totalAmount * 100) / 100;
    });

    Object.keys(byCurrency).forEach((key) => {
      byCurrency[key].totalAmount =
        Math.round(byCurrency[key].totalAmount * 100) / 100;
    });

    return {
      success: true,
      data: {
        summary,
        byType,
        byStatus,
        byCurrency,
        recentActivity,
      },
    };
  } catch (error: any) {
    console.error("Get transaction stats error:", error);

    return {
      success: false,
      error: error.message || "Failed to calculate statistics",
    };
  }
}

// ============================================================================
// EXPORT TRANSACTIONS ACTION (CSV)
// ============================================================================

/**
 * Export transactions to CSV format
 * @param filters - Optional filters
 * @returns ActionResponse with CSV data
 */
export async function exportTransactionsAction(
  filters?: TransactionFilter
): Promise<ActionResponse<{ csv: string; filename: string }>> {
  try {
    const session = await requireAuth();
    await connectDB();

    // Build query
    const query: any = { userId: session.user.id };

    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.currency) query.currency = filters.currency;

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    // Fetch all matching transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Generate CSV
    const headers = [
      "Date",
      "Type",
      "Amount",
      "Currency",
      "Status",
      "Completed Date",
      "Transaction ID",
    ];

    let csv = headers.join(",") + "\n";

    for (const tx of transactions) {
      const row = [
        tx.createdAt.toISOString(),
        tx.type,
        tx.amount.toFixed(2),
        tx.currency,
        tx.status,
        tx.completedAt ? tx.completedAt.toISOString() : "N/A",
        tx._id.toString(),
      ];

      csv += row.map((field) => `"${field}"`).join(",") + "\n";
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `galla-gold-transactions-${timestamp}.csv`;

    return {
      success: true,
      data: {
        csv,
        filename,
      },
    };
  } catch (error: any) {
    console.error("Export transactions error:", error);

    return {
      success: false,
      error: error.message || "Failed to export transactions",
    };
  }
}

// ============================================================================
// GET PENDING TRANSACTIONS ACTION
// ============================================================================

/**
 * Get all pending transactions for the user
 * @returns ActionResponse with pending transactions
 */
export async function getPendingTransactionsAction(): Promise<
  ActionResponse<{ transactions: any[] }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const transactions = await Transaction.find({
      userId: session.user.id,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx._id.toString(),
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          createdAt: tx.createdAt,
          metadata: tx.metadata,
        })),
      },
    };
  } catch (error: any) {
    console.error("Get pending transactions error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch pending transactions",
    };
  }
}

// ============================================================================
// GET FAILED TRANSACTIONS ACTION
// ============================================================================

/**
 * Get all failed transactions for the user
 * @returns ActionResponse with failed transactions
 */
export async function getFailedTransactionsAction(): Promise<
  ActionResponse<{ transactions: any[] }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const transactions = await Transaction.find({
      userId: session.user.id,
      status: "failed",
    })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 failed transactions
      .lean();

    return {
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx._id.toString(),
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          createdAt: tx.createdAt,
          metadata: tx.metadata,
        })),
      },
    };
  } catch (error: any) {
    console.error("Get failed transactions error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch failed transactions",
    };
  }
}

// ============================================================================
// SEARCH TRANSACTIONS ACTION
// ============================================================================

/**
 * Search transactions by transaction ID or metadata
 * @param searchQuery - Search term
 * @returns ActionResponse with matching transactions
 */
export async function searchTransactionsAction(
  searchQuery: string
): Promise<ActionResponse<{ transactions: any[] }>> {
  try {
    const session = await requireAuth();
    await connectDB();

    if (!searchQuery || searchQuery.trim().length < 3) {
      return {
        success: false,
        error: "Search query must be at least 3 characters",
      };
    }

    // Search by transaction ID or metadata
    const transactions = await Transaction.find({
      userId: session.user.id,
      $or: [
        { _id: { $regex: searchQuery, $options: "i" } },
        { "metadata.transactionId": { $regex: searchQuery, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return {
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx._id.toString(),
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt,
          metadata: tx.metadata,
        })),
      },
    };
  } catch (error: any) {
    console.error("Search transactions error:", error);

    return {
      success: false,
      error: error.message || "Failed to search transactions",
    };
  }
}
