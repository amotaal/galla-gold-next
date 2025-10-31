// /server/actions/wallet.ts
// Wallet management server actions
// Handles deposits, withdrawals, balance queries, and transaction limits

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
// GET BALANCE ACTION
// ============================================================================

/**
 * Get user's current wallet balance
 * @returns ActionResponse with balance data
 * 
 * Returns all currency balances and gold holdings
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

    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Calculate total portfolio value in USD
    let totalValueUSD = wallet.balance.USD || 0;

    // Convert other currencies to USD
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

    // Add gold value
    if (wallet.gold.grams > 0) {
      const goldValueUSD = wallet.gold.grams * wallet.gold.averagePurchasePrice;
      totalValueUSD += goldValueUSD;
    }

    return {
      success: true,
      data: {
        balance: wallet.balance,
        gold: {
          grams: wallet.gold.grams,
          averagePurchasePrice: wallet.gold.averagePurchasePrice,
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
// GET TRANSACTION LIMITS ACTION
// ============================================================================

/**
 * Get user's transaction limits (daily and lifetime)
 * @returns ActionResponse with limits data
 * 
 * Returns current limits, used amounts, and remaining amounts
 */
export async function getTransactionLimitsAction(): Promise<
  ActionResponse<{
    daily: Record<string, { limit: number; used: number; remaining: number }>;
    lifetime: Record<string, { limit: number; used: number; remaining: number }>;
    resetDate: Date;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Check if daily limits need reset (24 hours passed)
    const now = new Date();
    const lastReset = wallet.lastReset;
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      // Reset daily usage
      wallet.usedToday = {
        deposit: 0,
        withdrawal: 0,
        goldPurchase: 0,
        goldSale: 0,
      };
      wallet.lastReset = now;
      await wallet.save();
    }

    // Calculate remaining limits
    const daily = {
      deposit: {
        limit: wallet.dailyLimits.deposit,
        used: wallet.usedToday.deposit,
        remaining: wallet.dailyLimits.deposit - wallet.usedToday.deposit,
      },
      withdrawal: {
        limit: wallet.dailyLimits.withdrawal,
        used: wallet.usedToday.withdrawal,
        remaining: wallet.dailyLimits.withdrawal - wallet.usedToday.withdrawal,
      },
      goldPurchase: {
        limit: wallet.dailyLimits.goldPurchase,
        used: wallet.usedToday.goldPurchase,
        remaining: wallet.dailyLimits.goldPurchase - wallet.usedToday.goldPurchase,
      },
      goldSale: {
        limit: wallet.dailyLimits.goldSale,
        used: wallet.usedToday.goldSale,
        remaining: wallet.dailyLimits.goldSale - wallet.usedToday.goldSale,
      },
    };

    // Lifetime limits (total across all transactions)
    const transactions = await Transaction.find({
      userId: session.user.id,
      status: "completed",
    });

    let lifetimeUsed = {
      deposit: 0,
      withdrawal: 0,
      goldPurchase: 0,
      goldSale: 0,
    };

    for (const tx of transactions) {
      const amountUSD = await convertCurrency(
        tx.amount,
        tx.currency as any,
        "USD"
      );

      if (tx.type === "deposit") lifetimeUsed.deposit += amountUSD;
      if (tx.type === "withdrawal") lifetimeUsed.withdrawal += amountUSD;
      if (tx.type === "gold_purchase") lifetimeUsed.goldPurchase += amountUSD;
      if (tx.type === "gold_sale") lifetimeUsed.goldSale += amountUSD;
    }

    const lifetime = {
      deposit: {
        limit: wallet.lifetimeLimits.deposit,
        used: lifetimeUsed.deposit,
        remaining: wallet.lifetimeLimits.deposit - lifetimeUsed.deposit,
      },
      withdrawal: {
        limit: wallet.lifetimeLimits.withdrawal,
        used: lifetimeUsed.withdrawal,
        remaining: wallet.lifetimeLimits.withdrawal - lifetimeUsed.withdrawal,
      },
      goldPurchase: {
        limit: wallet.lifetimeLimits.goldPurchase,
        used: lifetimeUsed.goldPurchase,
        remaining: wallet.lifetimeLimits.goldPurchase - lifetimeUsed.goldPurchase,
      },
      goldSale: {
        limit: wallet.lifetimeLimits.goldSale,
        used: lifetimeUsed.goldSale,
        remaining: wallet.lifetimeLimits.goldSale - lifetimeUsed.goldSale,
      },
    };

    return {
      success: true,
      data: {
        daily,
        lifetime,
        resetDate: wallet.lastReset,
      },
    };
  } catch (error: any) {
    console.error("Get limits error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch transaction limits",
    };
  }
}

// ============================================================================
// DEPOSIT ACTION
// ============================================================================

/**
 * Deposit funds into wallet
 * @param formData - Deposit form data
 * @returns ActionResponse with transaction data
 * 
 * Process:
 * 1. Validate input
 * 2. Check daily/lifetime limits
 * 3. Create pending transaction
 * 4. In production: Integrate with payment provider (Stripe, etc.)
 * 5. Update balance when payment confirmed
 */
export async function depositAction(
  formData: FormData
): Promise<ActionResponse<{ transactionId: string }>> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const rawData = {
      amount: parseFloat(formData.get("amount") as string),
      currency: formData.get("currency"),
      paymentMethod: formData.get("paymentMethod"),
    };

    const validated = depositSchema.parse(rawData);

    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id });
    const user = await User.findById(session.user.id);

    if (!wallet || !user) {
      return {
        success: false,
        error: "Wallet or user not found",
      };
    }

    // Convert to USD for limit checking
    const amountUSD = await convertCurrency(
      validated.amount,
      validated.currency,
      "USD"
    );

    // Check daily limit
    if (wallet.usedToday.deposit + amountUSD > wallet.dailyLimits.deposit) {
      return {
        success: false,
        error: `Daily deposit limit exceeded. Remaining: $${(
          wallet.dailyLimits.deposit - wallet.usedToday.deposit
        ).toFixed(2)}`,
      };
    }

    // Check lifetime limit
    const transactions = await Transaction.find({
      userId: session.user.id,
      type: "deposit",
      status: "completed",
    });

    let lifetimeDeposits = 0;
    for (const tx of transactions) {
      const txAmountUSD = await convertCurrency(tx.amount, tx.currency as any, "USD");
      lifetimeDeposits += txAmountUSD;
    }

    if (lifetimeDeposits + amountUSD > wallet.lifetimeLimits.deposit) {
      return {
        success: false,
        error: `Lifetime deposit limit exceeded`,
      };
    }

    // Create transaction record (pending)
    const transaction = await Transaction.create({
      userId: session.user.id,
      type: "deposit",
      amount: validated.amount,
      currency: validated.currency,
      status: "pending",
      metadata: {
        paymentMethod: validated.paymentMethod,
      },
    });

    // TODO: In production, integrate with payment provider here
    // For now, we'll simulate instant completion

    // Simulate payment processing (in production, this would be a webhook)
    // Update balance
    wallet.balance[validated.currency] = (wallet.balance[validated.currency] || 0) + validated.amount;
    wallet.usedToday.deposit += amountUSD;
    await wallet.save();

    // Update transaction status
    transaction.status = "completed";
    transaction.completedAt = new Date();
    await transaction.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Deposit Successful - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Deposit",
        amount: `${validated.currency} ${validated.amount.toFixed(2)}`,
        date: new Date().toLocaleDateString(),
        transactionId: transaction._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: `Successfully deposited ${validated.currency} ${validated.amount.toFixed(2)}`,
      data: {
        transactionId: transaction._id.toString(),
      },
    };
  } catch (error: any) {
    console.error("Deposit error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to process deposit",
    };
  }
}

// ============================================================================
// WITHDRAWAL ACTION
// ============================================================================

/**
 * Withdraw funds from wallet
 * @param formData - Withdrawal form data
 * @returns ActionResponse with transaction data
 * 
 * Process:
 * 1. Validate input
 * 2. Check sufficient balance
 * 3. Check daily/lifetime limits
 * 4. Deduct from balance
 * 5. Create transaction record
 * 6. In production: Initiate bank transfer
 */
export async function withdrawAction(
  formData: FormData
): Promise<ActionResponse<{ transactionId: string }>> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const rawData = {
      amount: parseFloat(formData.get("amount") as string),
      currency: formData.get("currency"),
      bankAccount: {
        accountNumber: formData.get("accountNumber") as string,
        bankName: formData.get("bankName") as string,
        swiftCode: formData.get("swiftCode") as string || undefined,
        iban: formData.get("iban") as string || undefined,
      },
    };

    const validated = withdrawalSchema.parse(rawData);

    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id });
    const user = await User.findById(session.user.id);

    if (!wallet || !user) {
      return {
        success: false,
        error: "Wallet or user not found",
      };
    }

    // Check sufficient balance
    const currentBalance = wallet.balance[validated.currency] || 0;
    if (currentBalance < validated.amount) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${validated.currency} ${currentBalance.toFixed(2)}`,
      };
    }

    // Convert to USD for limit checking
    const amountUSD = await convertCurrency(
      validated.amount,
      validated.currency,
      "USD"
    );

    // Check daily limit
    if (wallet.usedToday.withdrawal + amountUSD > wallet.dailyLimits.withdrawal) {
      return {
        success: false,
        error: `Daily withdrawal limit exceeded. Remaining: $${(
          wallet.dailyLimits.withdrawal - wallet.usedToday.withdrawal
        ).toFixed(2)}`,
      };
    }

    // Deduct from balance
    wallet.balance[validated.currency] -= validated.amount;
    wallet.usedToday.withdrawal += amountUSD;
    await wallet.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: session.user.id,
      type: "withdrawal",
      amount: validated.amount,
      currency: validated.currency,
      status: "pending", // Will be completed when bank transfer is done
      metadata: {
        bankAccount: validated.bankAccount,
      },
    });

    // TODO: In production, initiate bank transfer via payment provider

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: "Withdrawal Requested - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Withdrawal",
        amount: `${validated.currency} ${validated.amount.toFixed(2)}`,
        date: new Date().toLocaleDateString(),
        transactionId: transaction._id.toString(),
        status: "pending",
      },
    });

    return {
      success: true,
      message: `Withdrawal of ${validated.currency} ${validated.amount.toFixed(2)} is being processed`,
      data: {
        transactionId: transaction._id.toString(),
      },
    };
  } catch (error: any) {
    console.error("Withdrawal error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to process withdrawal",
    };
  }
}

// ============================================================================
// CONVERT CURRENCY ACTION
// ============================================================================

/**
 * Convert between currencies in wallet
 * @param formData - Conversion data
 * @returns ActionResponse with conversion result
 * 
 * Process:
 * 1. Validate amounts and currencies
 * 2. Check sufficient balance
 * 3. Perform conversion
 * 4. Update balances
 * 5. Create transaction record
 */
export async function convertCurrencyAction(
  formData: FormData
): Promise<ActionResponse<{ newBalance: Record<string, number> }>> {
  try {
    const session = await requireAuth();

    const fromCurrency = formData.get("fromCurrency") as string;
    const toCurrency = formData.get("toCurrency") as string;
    const amount = parseFloat(formData.get("amount") as string);

    if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
      return {
        success: false,
        error: "Invalid conversion parameters",
      };
    }

    if (fromCurrency === toCurrency) {
      return {
        success: false,
        error: "Cannot convert to same currency",
      };
    }

    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Check sufficient balance
    const currentBalance = wallet.balance[fromCurrency] || 0;
    if (currentBalance < amount) {
      return {
        success: false,
        error: `Insufficient ${fromCurrency} balance`,
      };
    }

    // Perform conversion
    const convertedAmount = await convertCurrency(
      amount,
      fromCurrency as any,
      toCurrency as any
    );

    // Update balances
    wallet.balance[fromCurrency] -= amount;
    wallet.balance[toCurrency] = (wallet.balance[toCurrency] || 0) + convertedAmount;
    await wallet.save();

    // Create transaction record
    await Transaction.create({
      userId: session.user.id,
      type: "conversion",
      amount: amount,
      currency: fromCurrency,
      status: "completed",
      completedAt: new Date(),
      metadata: {
        fromCurrency,
        toCurrency,
        fromAmount: amount,
        toAmount: convertedAmount,
      },
    });

    return {
      success: true,
      message: `Converted ${fromCurrency} ${amount.toFixed(2)} to ${toCurrency} ${convertedAmount.toFixed(2)}`,
      data: {
        newBalance: wallet.balance,
      },
    };
  } catch (error: any) {
    console.error("Currency conversion error:", error);

    return {
      success: false,
      error: error.message || "Failed to convert currency",
    };
  }
}
