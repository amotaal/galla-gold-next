// server/actions/admin/reports.ts
// Purpose: Admin Reports & Analytics Generation
// Generate comprehensive reports for business intelligence and compliance

"use server";

import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import Transaction from "@/server/models/Transaction";
import Wallet from "@/server/models/Wallet";
import KYC from "@/server/models/KYC";
import { hasPermission, PERMISSIONS } from "@/server/lib/permissions";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const dateRangeSchema = z.object({
  startDate: z.string(), // ISO date
  endDate: z.string(),   // ISO date
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function verifyReportPermission(
  adminId: string
): Promise<{
  success: boolean;
  admin?: any;
  error?: string;
}> {
  await dbConnect();
  const admin = await User.findById(adminId);
  if (!admin || !hasPermission(admin.role, PERMISSIONS.REPORTS_VIEW)) {
    return { success: false, error: "Insufficient permissions" };
  }
  return { success: true, admin };
}

// =============================================================================
// FINANCIAL REPORTS
// =============================================================================

/**
 * Generate financial report
 * Permission: REPORTS_VIEW
 */
export async function generateFinancialReport(
  adminId: string,
  dateRange: z.infer<typeof dateRangeSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyReportPermission(adminId);
    if (!permCheck.success) return { success: false, error: permCheck.error };

    const validated = dateRangeSchema.parse(dateRange);
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    await dbConnect();

    // Get transaction aggregates
    const [revenue, deposits, withdrawals, goldPurchases, goldSales, fees] = await Promise.all([
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "deposit", createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "withdrawal", createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ["gold_purchase", "buy_gold"] }, createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ["gold_sale", "sell_gold"] }, createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$fee" } } },
      ]),
    ]);

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        revenue: revenue[0]?.total || 0,
        deposits: { total: deposits[0]?.total || 0, count: deposits[0]?.count || 0 },
        withdrawals: { total: withdrawals[0]?.total || 0, count: withdrawals[0]?.count || 0 },
        goldPurchases: { total: goldPurchases[0]?.total || 0, count: goldPurchases[0]?.count || 0 },
        goldSales: { total: goldSales[0]?.total || 0, count: goldSales[0]?.count || 0 },
        totalFees: fees[0]?.total || 0,
        netRevenue: (fees[0]?.total || 0),
      },
    };
  } catch (error: any) {
    console.error("Generate financial report error:", error);
    return { success: false, error: error.message || "Failed to generate report" };
  }
}

/**
 * Generate user growth report
 * Permission: REPORTS_VIEW
 */
export async function generateUserGrowthReport(
  adminId: string,
  dateRange: z.infer<typeof dateRangeSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyReportPermission(adminId);
    if (!permCheck.success) return { success: false, error: permCheck.error };

    const validated = dateRangeSchema.parse(dateRange);
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    await dbConnect();

    const [totalUsers, newUsers, activeUsers, verifiedKYC] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: endDate } }),
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      User.countDocuments({ lastLoginAt: { $gte: startDate, $lte: endDate } }),
      User.countDocuments({ kycStatus: "verified", kycVerifiedAt: { $gte: startDate, $lte: endDate } }),
    ]);

    // Daily signups
    const dailySignups = await User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        totalUsers,
        newUsers,
        activeUsers,
        verifiedKYC,
        dailySignups,
      },
    };
  } catch (error: any) {
    console.error("Generate user growth report error:", error);
    return { success: false, error: error.message || "Failed to generate report" };
  }
}

/**
 * Generate KYC compliance report
 * Permission: REPORTS_VIEW
 */
export async function generateKYCReport(
  adminId: string,
  dateRange: z.infer<typeof dateRangeSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyReportPermission(adminId);
    if (!permCheck.success) return { success: false, error: permCheck.error };

    const validated = dateRangeSchema.parse(dateRange);
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    await dbConnect();

    const [submitted, verified, rejected, pending, avgProcessingTime] = await Promise.all([
      KYC.countDocuments({ submittedAt: { $gte: startDate, $lte: endDate } }),
      KYC.countDocuments({ verifiedAt: { $gte: startDate, $lte: endDate } }),
      KYC.countDocuments({ rejectedAt: { $gte: startDate, $lte: endDate } }),
      KYC.countDocuments({ status: { $in: ["pending", "submitted"] } }),
      KYC.aggregate([
        {
          $match: {
            verifiedAt: { $gte: startDate, $lte: endDate },
            submittedAt: { $exists: true },
          },
        },
        {
          $project: {
            processingTime: { $subtract: ["$verifiedAt", "$submittedAt"] },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$processingTime" },
          },
        },
      ]),
    ]);

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        submitted,
        verified,
        rejected,
        pending,
        avgProcessingTimeHours: avgProcessingTime[0]?.avgTime
          ? avgProcessingTime[0].avgTime / (1000 * 60 * 60)
          : 0,
        approvalRate: submitted > 0 ? (verified / submitted) * 100 : 0,
      },
    };
  } catch (error: any) {
    console.error("Generate KYC report error:", error);
    return { success: false, error: error.message || "Failed to generate report" };
  }
}

/**
 * Generate transaction volume report
 * Permission: REPORTS_VIEW
 */
export async function generateTransactionVolumeReport(
  adminId: string,
  dateRange: z.infer<typeof dateRangeSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyReportPermission(adminId);
    if (!permCheck.success) return { success: false, error: permCheck.error };

    const validated = dateRangeSchema.parse(dateRange);
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    await dbConnect();

    // Daily transaction volume
    const dailyVolume = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          volume: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Volume by type
    const volumeByType = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "completed" } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          volume: { $sum: "$amount" },
        },
      },
    ]);

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        dailyVolume,
        volumeByType,
      },
    };
  } catch (error: any) {
    console.error("Generate transaction volume report error:", error);
    return { success: false, error: error.message || "Failed to generate report" };
  }
}

// =============================================================================
// DASHBOARD OVERVIEW
// =============================================================================

/**
 * Get admin dashboard overview data
 * Permission: REPORTS_VIEW
 */
export async function getDashboardOverview(
  adminId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyReportPermission(adminId);
    if (!permCheck.success) return { success: false, error: permCheck.error };

    await dbConnect();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      pendingKYC,
      totalTransactions,
      transactionsToday,
      transactionVolume,
      goldHoldings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      KYC.countDocuments({ status: { $in: ["pending", "submitted"] } }),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.countDocuments({ createdAt: { $gte: todayStart }, status: "completed" }),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Wallet.aggregate([
        { $group: { _id: null, totalGold: { $sum: "$gold.grams" } } },
      ]),
    ]);

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisMonth: newUsersThisMonth,
        },
        kyc: {
          pending: pendingKYC,
        },
        transactions: {
          total: totalTransactions,
          today: transactionsToday,
          volume: transactionVolume[0]?.total || 0,
        },
        gold: {
          totalGrams: goldHoldings[0]?.totalGold || 0,
        },
      },
    };
  } catch (error: any) {
    console.error("Get dashboard overview error:", error);
    return { success: false, error: error.message || "Failed to fetch dashboard data" };
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  generateFinancialReport,
  generateUserGrowthReport,
  generateKYCReport,
  generateTransactionVolumeReport,
  getDashboardOverview,
};
