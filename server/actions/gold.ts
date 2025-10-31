// /server/actions/gold.ts
// Gold trading server actions
// Handles buying, selling gold, physical delivery, and price queries

"use server";

import { requireAuth, requireKYC } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import Wallet from "@/server/models/Wallet";
import Transaction from "@/server/models/Transaction";
import Price from "@/server/models/Price";
import {
  buyGoldSchema,
  sellGoldSchema,
  deliverySchema,
} from "@/server/lib/validation";
import {
  getGoldPricePerGram,
  calculateBuyGoldCost,
  calculateSellGoldProceeds,
  calculateDeliveryCost,
  convertCurrency,
} from "@/server/lib/currency";
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
// GET GOLD PRICE ACTION
// ============================================================================

/**
 * Get current gold price per gram in specified currency
 * @param currency - Target currency (default: USD)
 * @returns ActionResponse with price data
 *
 * Returns current spot price, buy price (with fee), and sell price (with fee)
 */
export async function getGoldPriceAction(currency: string = "USD"): Promise<
  ActionResponse<{
    spotPrice: number;
    buyPrice: number;
    sellPrice: number;
    currency: string;
    lastUpdated: Date;
  }>
> {
  try {
    const spotPrice = await getGoldPricePerGram(currency as any);

    // Calculate buy and sell prices with fees
    const buyCalculation = await calculateBuyGoldCost(1, currency as any);
    const sellCalculation = await calculateSellGoldProceeds(1, currency as any);

    return {
      success: true,
      data: {
        spotPrice,
        buyPrice: buyCalculation.pricePerGram,
        sellPrice: sellCalculation.pricePerGram,
        currency,
        lastUpdated: new Date(),
      },
    };
  } catch (error: any) {
    console.error("Get gold price error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch gold price",
    };
  }
}

// ============================================================================
// GET GOLD HOLDINGS ACTION
// ============================================================================

/**
 * Get user's gold holdings
 * @returns ActionResponse with holdings data
 *
 * Returns total grams, average purchase price, current value, and profit/loss
 */
export async function getGoldHoldingsAction(): Promise<
  ActionResponse<{
    grams: number;
    averagePurchasePrice: number;
    currentPricePerGram: number;
    totalValue: number;
    totalCost: number;
    profitLoss: number;
    profitLossPercent: number;
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

    const grams = wallet.gold.grams;
    const averagePurchasePrice = wallet.gold.averagePurchasePrice;

    // Get current gold price
    const currentPricePerGram = await getGoldPricePerGram("USD");

    // Calculate values
    const totalCost = grams * averagePurchasePrice;
    const totalValue = grams * currentPricePerGram;
    const profitLoss = totalValue - totalCost;
    const profitLossPercent =
      totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      success: true,
      data: {
        grams: Math.round(grams * 1000000) / 1000000, // 6 decimal precision
        averagePurchasePrice: Math.round(averagePurchasePrice * 100) / 100,
        currentPricePerGram: Math.round(currentPricePerGram * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      },
    };
  } catch (error: any) {
    console.error("Get gold holdings error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch gold holdings",
    };
  }
}

// ============================================================================
// BUY GOLD ACTION
// ============================================================================

/**
 * Buy gold with wallet balance
 * @param formData - Buy gold form data
 * @returns ActionResponse with transaction data
 *
 * Process:
 * 1. Validate input
 * 2. Check sufficient balance
 * 3. Check daily/lifetime limits
 * 4. Calculate cost with fees
 * 5. Deduct from balance
 * 6. Add gold to holdings
 * 7. Update average purchase price
 * 8. Create transaction record
 */
export async function buyGoldAction(
  formData: FormData
): Promise<ActionResponse<{ transactionId: string; grams: number }>> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const rawData = {
      grams: parseFloat(formData.get("grams") as string),
      currency: formData.get("currency"),
      totalAmount: parseFloat(formData.get("totalAmount") as string),
      pricePerGram: parseFloat(formData.get("pricePerGram") as string),
    };

    const validated = buyGoldSchema.parse(rawData);

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
    if (currentBalance < validated.totalAmount) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${
          validated.currency
        } ${currentBalance.toFixed(2)}`,
      };
    }

    // Convert to USD for limit checking
    const amountUSD = await convertCurrency(
      validated.totalAmount,
      validated.currency,
      "USD"
    );

    // Check daily limit
    if (
      wallet.usedToday.goldPurchase + amountUSD >
      wallet.dailyLimits.goldPurchase
    ) {
      return {
        success: false,
        error: `Daily gold purchase limit exceeded`,
      };
    }

    // Verify price hasn't changed significantly (within 2% tolerance)
    const costBreakdown = await calculateBuyGoldCost(
      validated.grams,
      validated.currency
    );

    const priceDifference = Math.abs(
      costBreakdown.total - validated.totalAmount
    );
    const tolerance = validated.totalAmount * 0.02; // 2% tolerance

    if (priceDifference > tolerance) {
      return {
        success: false,
        error: "Price has changed. Please refresh and try again.",
      };
    }

    // Deduct from balance
    wallet.balance[validated.currency] -= validated.totalAmount;
    wallet.usedToday.goldPurchase += amountUSD;

    // Calculate new average purchase price (weighted average)
    const currentGrams = wallet.gold.grams;
    const currentAvgPrice = wallet.gold.averagePurchasePrice;
    const currentTotalCost = currentGrams * currentAvgPrice;

    const pricePerGramUSD = await convertCurrency(
      validated.pricePerGram,
      validated.currency,
      "USD"
    );

    const newTotalCost = currentTotalCost + validated.grams * pricePerGramUSD;
    const newTotalGrams = currentGrams + validated.grams;
    const newAvgPrice = newTotalGrams > 0 ? newTotalCost / newTotalGrams : 0;

    // Update gold holdings
    wallet.gold.grams = newTotalGrams;
    wallet.gold.averagePurchasePrice = newAvgPrice;

    await wallet.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: session.user.id,
      type: "gold_purchase",
      amount: validated.totalAmount,
      currency: validated.currency,
      status: "completed",
      completedAt: new Date(),
      metadata: {
        grams: validated.grams,
        pricePerGram: validated.pricePerGram,
        fee: costBreakdown.fee,
        feePercentage: costBreakdown.feePercentage,
      },
    });

    // Record price history
    await Price.create({
      pricePerGram: pricePerGramUSD,
      currency: "USD",
      timestamp: new Date(),
    });

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Gold Purchase Successful - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Gold Purchase",
        amount: `${validated.grams.toFixed(6)} g (${
          validated.currency
        } ${validated.totalAmount.toFixed(2)})`,
        date: new Date().toLocaleDateString(),
        transactionId: transaction._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: `Successfully purchased ${validated.grams.toFixed(
        6
      )} grams of gold`,
      data: {
        transactionId: transaction._id.toString(),
        grams: validated.grams,
      },
    };
  } catch (error: any) {
    console.error("Buy gold error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to purchase gold",
    };
  }
}

// ============================================================================
// SELL GOLD ACTION
// ============================================================================

/**
 * Sell gold for wallet balance
 * @param formData - Sell gold form data
 * @returns ActionResponse with transaction data
 *
 * Process:
 * 1. Validate input
 * 2. Check sufficient gold holdings
 * 3. Check daily/lifetime limits
 * 4. Calculate proceeds with fees
 * 5. Deduct from gold holdings
 * 6. Add to balance
 * 7. Create transaction record
 */
export async function sellGoldAction(
  formData: FormData
): Promise<ActionResponse<{ transactionId: string; proceeds: number }>> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const rawData = {
      grams: parseFloat(formData.get("grams") as string),
      currency: formData.get("currency"),
      totalAmount: parseFloat(formData.get("totalAmount") as string),
      pricePerGram: parseFloat(formData.get("pricePerGram") as string),
    };

    const validated = sellGoldSchema.parse(rawData);

    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id });
    const user = await User.findById(session.user.id);

    if (!wallet || !user) {
      return {
        success: false,
        error: "Wallet or user not found",
      };
    }

    // Check sufficient gold holdings
    if (wallet.gold.grams < validated.grams) {
      return {
        success: false,
        error: `Insufficient gold. Available: ${wallet.gold.grams.toFixed(
          6
        )} grams`,
      };
    }

    // Convert to USD for limit checking
    const amountUSD = await convertCurrency(
      validated.totalAmount,
      validated.currency,
      "USD"
    );

    // Check daily limit
    if (wallet.usedToday.goldSale + amountUSD > wallet.dailyLimits.goldSale) {
      return {
        success: false,
        error: `Daily gold sale limit exceeded`,
      };
    }

    // Verify price hasn't changed significantly (within 2% tolerance)
    const proceedsBreakdown = await calculateSellGoldProceeds(
      validated.grams,
      validated.currency
    );

    const priceDifference = Math.abs(
      proceedsBreakdown.netProceeds - validated.totalAmount
    );
    const tolerance = validated.totalAmount * 0.02; // 2% tolerance

    if (priceDifference > tolerance) {
      return {
        success: false,
        error: "Price has changed. Please refresh and try again.",
      };
    }

    // Deduct from gold holdings
    wallet.gold.grams -= validated.grams;

    // If all gold sold, reset average purchase price
    if (wallet.gold.grams <= 0) {
      wallet.gold.grams = 0;
      wallet.gold.averagePurchasePrice = 0;
    }

    // Add to balance
    wallet.balance[validated.currency] =
      (wallet.balance[validated.currency] || 0) + validated.totalAmount;
    wallet.usedToday.goldSale += amountUSD;

    await wallet.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: session.user.id,
      type: "gold_sale",
      amount: validated.totalAmount,
      currency: validated.currency,
      status: "completed",
      completedAt: new Date(),
      metadata: {
        grams: validated.grams,
        pricePerGram: validated.pricePerGram,
        fee: proceedsBreakdown.fee,
        feePercentage: proceedsBreakdown.feePercentage,
      },
    });

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Gold Sale Successful - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Gold Sale",
        amount: `${validated.grams.toFixed(6)} g (${
          validated.currency
        } ${validated.totalAmount.toFixed(2)})`,
        date: new Date().toLocaleDateString(),
        transactionId: transaction._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: `Successfully sold ${validated.grams.toFixed(6)} grams of gold`,
      data: {
        transactionId: transaction._id.toString(),
        proceeds: validated.totalAmount,
      },
    };
  } catch (error: any) {
    console.error("Sell gold error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to sell gold",
    };
  }
}

// ============================================================================
// REQUEST PHYSICAL DELIVERY ACTION
// ============================================================================

/**
 * Request physical gold delivery
 * @param formData - Delivery request form data
 * @returns ActionResponse with delivery request data
 *
 * Requires KYC verification for physical delivery
 *
 * Process:
 * 1. Require KYC verification
 * 2. Validate input
 * 3. Check sufficient gold holdings
 * 4. Calculate delivery cost
 * 5. Deduct gold and delivery cost
 * 6. Create delivery transaction
 */
export async function requestPhysicalDeliveryAction(
  formData: FormData
): Promise<ActionResponse<{ deliveryId: string; estimatedDate: Date }>> {
  try {
    // Require KYC verification for physical delivery
    const session = await requireKYC();

    // Extract and validate data
    const rawData = {
      grams: parseFloat(formData.get("grams") as string),
      deliveryAddress: {
        street: formData.get("street") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        postalCode: formData.get("postalCode") as string,
        country: formData.get("country") as string,
      },
      deliveryType: formData.get("deliveryType") as string,
    };

    const validated = deliverySchema.parse(rawData);

    await connectDB();

    const wallet = await Wallet.findOne({ userId: session.user.id });
    const user = await User.findById(session.user.id);

    if (!wallet || !user) {
      return {
        success: false,
        error: "Wallet or user not found",
      };
    }

    // Check sufficient gold holdings
    if (wallet.gold.grams < validated.grams) {
      return {
        success: false,
        error: `Insufficient gold. Available: ${wallet.gold.grams.toFixed(
          6
        )} grams`,
      };
    }

    // Calculate delivery cost
    const deliveryCost = await calculateDeliveryCost(
      validated.grams,
      validated.deliveryType,
      "USD"
    );

    // Check sufficient balance for delivery cost
    const balanceUSD = wallet.balance.USD || 0;
    if (balanceUSD < deliveryCost) {
      return {
        success: false,
        error: `Insufficient USD balance for delivery. Required: $${deliveryCost.toFixed(
          2
        )}`,
      };
    }

    // Deduct gold and delivery cost
    wallet.gold.grams -= validated.grams;
    wallet.balance.USD -= deliveryCost;

    // If all gold used, reset average price
    if (wallet.gold.grams <= 0) {
      wallet.gold.grams = 0;
      wallet.gold.averagePurchasePrice = 0;
    }

    await wallet.save();

    // Calculate estimated delivery date
    const deliveryDays = {
      standard: 7,
      express: 3,
      insured: 5,
    };

    const estimatedDate = new Date();
    estimatedDate.setDate(
      estimatedDate.getDate() + deliveryDays[validated.deliveryType]
    );

    // Create transaction record
    const transaction = await Transaction.create({
      userId: session.user.id,
      type: "gold_delivery",
      amount: deliveryCost,
      currency: "USD",
      status: "pending",
      metadata: {
        grams: validated.grams,
        deliveryAddress: validated.deliveryAddress,
        deliveryType: validated.deliveryType,
        deliveryCost: deliveryCost,
        estimatedDelivery: estimatedDate,
      },
    });

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Physical Gold Delivery Requested - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Physical Delivery",
        amount: `${validated.grams.toFixed(6)} grams`,
        date: new Date().toLocaleDateString(),
        transactionId: transaction._id.toString(),
        status: "pending",
      },
    });

    return {
      success: true,
      message: `Physical delivery of ${validated.grams.toFixed(
        6
      )} grams requested successfully`,
      data: {
        deliveryId: transaction._id.toString(),
        estimatedDate,
      },
    };
  } catch (error: any) {
    console.error("Request delivery error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to request physical delivery",
    };
  }
}

// ============================================================================
// GET GOLD PRICE HISTORY ACTION
// ============================================================================

/**
 * Get historical gold prices
 * @param days - Number of days of history (default 30)
 * @returns ActionResponse with price history
 */
export async function getGoldPriceHistoryAction(
  days: number = 30
): Promise<ActionResponse<{ prices: Array<{ date: Date; price: number }> }>> {
  try {
    await connectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prices = await Price.find({
      timestamp: { $gte: startDate },
      currency: "USD",
    })
      .sort({ timestamp: 1 })
      .select("pricePerGram timestamp");

    const priceHistory = prices.map((p) => ({
      date: p.timestamp,
      price: p.pricePerGram,
    }));

    return {
      success: true,
      data: {
        prices: priceHistory,
      },
    };
  } catch (error: any) {
    console.error("Get price history error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch price history",
    };
  }
}
