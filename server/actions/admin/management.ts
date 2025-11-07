// server/actions/admin/management.ts
// Purpose: Admin Transaction Processing Actions
// Allows admins to approve, complete, reject, and process pending transactions
// server/actions/admin/transaction-management.ts
// Purpose: Admin Transaction Processing Actions
// Allows admins to approve, complete, reject, and process pending transactions

"use server";

import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import Transaction from "@/server/models/Transaction";
import Wallet from "@/server/models/Wallet";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { auditTransactionAction } from "@/server/lib/audit";
import { sendEmail } from "@/server/email/send";
import { Types } from "mongoose";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const approveDepositSchema = z.object({
  transactionId: z.string(),
  notes: z.string().optional(),
});

const rejectTransactionSchema = z.object({
  transactionId: z.string(),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

const completeWithdrawalSchema = z.object({
  transactionId: z.string(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function verifyAdminPermission(
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
// APPROVE DEPOSIT
// =============================================================================

/**
 * Approve a pending deposit transaction
 * Permission: TRANSACTION_APPROVE
 */
export async function approveDeposit(
  adminId: string,
  data: z.infer<typeof approveDepositSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = approveDepositSchema.parse(data);

    const permCheck = await verifyAdminPermission(
      adminId,
      PERMISSIONS.TRANSACTION_APPROVE
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(validated.transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (transaction.type !== "deposit") {
      return { success: false, error: "Transaction is not a deposit" };
    }

    if (transaction.status !== "pending") {
      return {
        success: false,
        error: `Cannot approve transaction with status: ${transaction.status}`,
      };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    // Add funds to wallet
    const currency = transaction.currency;
    wallet.balance[currency] =
      (wallet.balance[currency] || 0) + transaction.netAmount;
    await wallet.save();

    // Mark transaction as completed
    transaction.status = "completed";
    transaction.completedAt = new Date();
    await transaction.addStatusUpdate("completed", validated.notes);
    await transaction.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Deposit Approved - GALLA.GOLD",
      template: "transaction",
      data: {
        firstName: user.firstName,
        transactionType: "Deposit",
        amount: transaction.amount,
        currency: transaction.currency,
        transactionId: transaction._id.toString(),
        status: "completed",
      },
    });

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "approve",
      transactionId: validated.transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason: validated.notes || "Deposit approved",
    });

    return {
      success: true,
      data: {
        message: "Deposit approved successfully",
        transaction,
      },
    };
  } catch (error: any) {
    console.error("Approve deposit error:", error);
    return {
      success: false,
      error: error.message || "Failed to approve deposit",
    };
  }
}

// =============================================================================
// COMPLETE WITHDRAWAL
// =============================================================================

/**
 * Complete a pending withdrawal transaction
 * Permission: TRANSACTION_APPROVE
 */
export async function completeWithdrawal(
  adminId: string,
  data: z.infer<typeof completeWithdrawalSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = completeWithdrawalSchema.parse(data);

    const permCheck = await verifyAdminPermission(
      adminId,
      PERMISSIONS.TRANSACTION_APPROVE
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(validated.transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (transaction.type !== "withdrawal") {
      return { success: false, error: "Transaction is not a withdrawal" };
    }

    if (transaction.status !== "pending") {
      return {
        success: false,
        error: `Cannot complete transaction with status: ${transaction.status}`,
      };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Mark transaction as completed
    transaction.status = "completed";
    transaction.completedAt = new Date();
    if (validated.paymentReference) {
      transaction.paymentReference = validated.paymentReference;
    }
    await transaction.addStatusUpdate("completed", validated.notes);
    await transaction.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Withdrawal Completed - GALLA.GOLD",
      template: "transaction",
      data: {
        firstName: user.firstName,
        transactionType: "Withdrawal",
        amount: transaction.amount,
        currency: transaction.currency,
        transactionId: transaction._id.toString(),
        status: "completed",
      },
    });

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "complete",
      transactionId: validated.transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason: validated.notes || "Withdrawal completed",
    });

    return {
      success: true,
      data: {
        message: "Withdrawal completed successfully",
        transaction,
      },
    };
  } catch (error: any) {
    console.error("Complete withdrawal error:", error);
    return {
      success: false,
      error: error.message || "Failed to complete withdrawal",
    };
  }
}

// =============================================================================
// REJECT TRANSACTION
// =============================================================================

/**
 * Reject a pending transaction
 * Permission: TRANSACTION_CANCEL
 */
export async function rejectTransaction(
  adminId: string,
  data: z.infer<typeof rejectTransactionSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = rejectTransactionSchema.parse(data);

    const permCheck = await verifyAdminPermission(
      adminId,
      PERMISSIONS.TRANSACTION_CANCEL
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const transaction = await Transaction.findById(validated.transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (transaction.status !== "pending") {
      return {
        success: false,
        error: `Cannot reject transaction with status: ${transaction.status}`,
      };
    }

    const user = await User.findById(transaction.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    // If it's a withdrawal, return the funds to wallet
    if (transaction.type === "withdrawal") {
      const currency = transaction.currency;
      wallet.balance[currency] =
        (wallet.balance[currency] || 0) + transaction.amount;
      await wallet.save();
    }

    // Mark transaction as failed
    transaction.status = "failed";
    transaction.failedAt = new Date();
    transaction.errorMessage = validated.reason;
    await transaction.addStatusUpdate("failed", validated.reason);
    await transaction.save();

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: `${
        transaction.type === "deposit" ? "Deposit" : "Withdrawal"
      } Rejected - GALLA.GOLD`,
      template: "transaction",
      data: {
        firstName: user.firstName,
        transactionType:
          transaction.type === "deposit" ? "Deposit" : "Withdrawal",
        amount: transaction.amount,
        currency: transaction.currency,
        transactionId: transaction._id.toString(),
        status: "rejected",
      },
    });

    // Audit log
    await auditTransactionAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "reject",
      transactionId: validated.transactionId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason: validated.reason,
    });

    return {
      success: true,
      data: {
        message: "Transaction rejected successfully",
        transaction,
      },
    };
  } catch (error: any) {
    console.error("Reject transaction error:", error);
    return {
      success: false,
      error: error.message || "Failed to reject transaction",
    };
  }
}

// =============================================================================
// GET PENDING TRANSACTIONS FOR ADMIN
// =============================================================================

/**
 * Get all pending transactions that need admin action
 * Permission: TRANSACTION_VIEW
 */
export async function getPendingTransactionsForAdmin(adminId: string): Promise<{
  success: boolean;
  data?: {
    deposits: any[];
    withdrawals: any[];
    total: number;
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyAdminPermission(
      adminId,
      PERMISSIONS.TRANSACTION_VIEW
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const [deposits, withdrawals] = await Promise.all([
      Transaction.find({ type: "deposit", status: "pending" })
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Transaction.find({ type: "withdrawal", status: "pending" })
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    return {
      success: true,
      data: {
        deposits,
        withdrawals,
        total: deposits.length + withdrawals.length,
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
