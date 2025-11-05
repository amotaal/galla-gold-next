// /server/actions/wallet.ts
// Wallet management server actions - CORRECTED VERSION
// Purpose: Handles deposits, withdrawals, balance queries with proper serialization
// FIX: All data properly serialized + correct email templates

"use server";

import { requireAuth } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import Wallet from "@/server/models/Wallet";
import Transaction from "@/server/models/Transaction";
import {
  depositSchema,
  withdrawalSchema,
} from "@/server/lib/validation";
import { convertCurrency } from "@/server/lib/currency";
import { sendEmail } from "@/server/email/send";

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

  // Handle Date objects
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
// GET BALANCE ACTION - FIXED
// ============================================================================

/**
 * Get user's current wallet balance
 * @returns ActionResponse with balance data (properly serialized)
 * 
 * Returns all currency balances and gold holdings as plain objects
 * FIX: All data is now properly serialized before returning
 */
export async function getBalanceAction(): Promise<
  ActionResponse<{
    balance: Record<string, number>;
    gold: { grams: number; averagePurchasePrice: number };
    totalValueUSD: number;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id }).lean(); // Use .lean() for plain objects

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Calculate total portfolio value in USD
    let totalValueUSD = wallet.balance?.USD || 0;

    // Convert other currencies to USD
    if (wallet.balance) {
      for (const [currency, amount] of Object.entries(wallet.balance)) {
        if (currency !== "USD" && amount > 0) {
          const converted = await convertCurrency(
            amount,
            currency as any,
            "USD"
          );
          totalValueUSD += converted;
        }
      }
    }

    // Add gold value
    if (wallet.gold?.grams > 0) {
      const goldValueUSD = wallet.gold.grams * (wallet.gold.averagePurchasePrice || 0);
      totalValueUSD += goldValueUSD;
    }

    // Return properly serialized data (plain objects only)
    return {
      success: true,
      data: {
        balance: serializeData(wallet.balance || {}),
        gold: {
          grams: wallet.gold?.grams || 0,
          averagePurchasePrice: wallet.gold?.averagePurchasePrice || 0,
        },
        totalValueUSD: Math.round(totalValueUSD * 100) / 100,
      },
    };
  } catch (error: any) {
    console.error("Get balance error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch balance",
    };
  }
}

// ============================================================================
// DEPOSIT ACTION
// ============================================================================

/**
 * Process a deposit to user's wallet
 * @param formData - Deposit form data
 * @returns ActionResponse with transaction details
 */
export async function depositAction(
  formData: FormData
): Promise<ActionResponse<{ transactionId: string }>> {
  try {
    const session = await requireAuth();
    await connectDB();

    // Validate input
    const rawData = {
      amount: parseFloat(formData.get("amount") as string),
      currency: formData.get("currency") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      fee: formData.get("fee") as string,
    };

    const validatedData = depositSchema.parse(rawData);

    // Calculate amounts, fees, etc
    const feePercent = validatedData.fee ? parseFloat(validatedData.fee) : 0;
    const feeAmount = (validatedData.amount * feePercent) / 100;
    const netAmount = validatedData.amount - feeAmount;



    // Find user's wallet
    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      userId: session.user.id,
      walletId: wallet._id,
      type: "deposit",
      amount: validatedData.amount,
      feeAmount: feeAmount,
      netAmount: netAmount,
      currency: validatedData.currency,
      status: "pending",
      paymentMethod: validatedData.paymentMethod,
      description: `Deposit ${validatedData.amount} ${validatedData.currency} via ${validatedData.paymentMethod}`,
    });

    // Send confirmation email using "transaction" template
    const user = await User.findById(session.user.id);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Deposit Initiated - GALLA.GOLD",
        template: "transaction", // ✅ FIXED: Use existing template
        data: {
          firstName: user.firstName,
          transactionType: "Deposit",
          amount: validatedData.amount,
          currency: validatedData.currency,
          transactionId: transaction._id.toString(),
          status: "pending",
        },
      });
    }

    return {
      success: true,
      message: "Deposit initiated successfully",
      data: {
        transactionId: transaction._id.toString(),
      },
    };
  } catch (error: any) {
    console.error("Deposit error:", error);

    return {
      success: false,
      error: error.message || "Failed to process deposit",
    };
  }
}

// ============================================================================
// WITHDRAWAL ACTION - FIXED NAME
// ============================================================================

/**
 * Process a withdrawal from user's wallet
 * @param formData - Withdrawal form data
 * @returns ActionResponse with transaction details
 */
export async function withdrawalAction( // ✅ FIXED: Renamed from withdrawAction
  formData: FormData
): Promise<ActionResponse<{ transactionId: string }>> {
  try {
    const session = await requireAuth();
    await connectDB();

    // Validate input
    const rawData = {
      amount: parseFloat(formData.get("amount") as string),
      currency: formData.get("currency") as string,
      bankAccount: formData.get("bankAccount") as string,
    };

    const validatedData = withdrawalSchema.parse(rawData);

    // Find user's wallet
    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Check if user has sufficient balance
    const currentBalance = wallet.balance[validatedData.currency] || 0;

    if (currentBalance < validatedData.amount) {
      return {
        success: false,
        error: "Insufficient balance",
      };
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      userId: session.user.id,
      walletId: wallet._id,
      type: "withdrawal",
      amount: validatedData.amount,
      currency: validatedData.currency,
      status: "pending",
      description: `Withdrawal ${validatedData.amount} ${validatedData.currency}`,
      metadata: {
        bankAccount: validatedData.bankAccount, // Store in metadata instead
      },
    });

    // Deduct balance immediately (mark as "pending" withdrawal)
    wallet.balance[validatedData.currency] -= validatedData.amount;
    await wallet.save();

    // Send confirmation email using "transaction" template
    const user = await User.findById(session.user.id);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: "Withdrawal Initiated - GALLA.GOLD",
        template: "transaction", // ✅ FIXED: Use existing template
        data: {
          firstName: user.firstName,
          transactionType: "Withdrawal",
          amount: validatedData.amount,
          currency: validatedData.currency,
          transactionId: transaction._id.toString(),
          status: "pending",
        },
      });
    }

    return {
      success: true,
      message: "Withdrawal initiated successfully",
      data: {
        transactionId: transaction._id.toString(),
      },
    };
  } catch (error: any) {
    console.error("Withdrawal error:", error);

    return {
      success: false,
      error: error.message || "Failed to process withdrawal",
    };
  }
}

// ============================================================================
// GET TRANSACTION LIMITS
// ============================================================================

/**
 * Get user's transaction limits based on KYC status
 * @returns ActionResponse with limits
 */
export async function getTransactionLimits(): Promise<
  ActionResponse<{
    dailyDepositLimit: number;
    dailyWithdrawalLimit: number;
    singleTransactionLimit: number;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Determine limits based on KYC status
    let limits;

    switch (user.kycStatus) {
      case "verified":
        limits = {
          dailyDepositLimit: 100000,
          dailyWithdrawalLimit: 50000,
          singleTransactionLimit: 50000,
        };
        break;
      case "pending":
        limits = {
          dailyDepositLimit: 10000,
          dailyWithdrawalLimit: 5000,
          singleTransactionLimit: 5000,
        };
        break;
      default: // "none"
        limits = {
          dailyDepositLimit: 1000,
          dailyWithdrawalLimit: 500,
          singleTransactionLimit: 500,
        };
    }

    return {
      success: true,
      data: limits,
    };
  } catch (error: any) {
    console.error("Get transaction limits error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch transaction limits",
    };
  }
}
