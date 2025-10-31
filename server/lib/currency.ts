// /server/lib/currency.ts
// Currency and Gold Price Utilities
// Purpose: Handle currency conversions, gold pricing, and fee calculations

import type { Currency } from "@/types";

// =============================================================================
// EXCHANGE RATES (In production, fetch from API)
// =============================================================================

/**
 * Current exchange rates relative to USD
 * In production, these should be fetched from a real-time currency API
 */
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  EGP: 48.5,
  AED: 3.67,
  SAR: 3.75,
};

/**
 * Gold price per gram in USD
 * In production, this should be fetched from a real-time gold price API
 */
const GOLD_PRICE_PER_GRAM_USD = 65.5;

// =============================================================================
// CURRENCY CONVERSION
// =============================================================================

/**
 * Convert amount from one currency to another
 *
 * @param amount - Amount to convert
 * @param from - Source currency
 * @param to - Target currency
 * @returns Converted amount
 *
 * @example
 * const eurAmount = await convertCurrency(100, 'USD', 'EUR');
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) return amount;

  // Convert to USD first
  const usdAmount = amount / EXCHANGE_RATES[from];

  // Then convert to target currency
  const convertedAmount = usdAmount * EXCHANGE_RATES[to];

  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Get exchange rate between two currencies
 *
 * @param from - Source currency
 * @param to - Target currency
 * @returns Exchange rate
 *
 * @example
 * const rate = getExchangeRate('USD', 'EUR'); // => 0.92
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) return 1;

  const usdRate = 1 / EXCHANGE_RATES[from];
  return usdRate * EXCHANGE_RATES[to];
}

/**
 * Get all exchange rates
 *
 * @returns Record of all exchange rates
 */
export function getAllExchangeRates(): Record<Currency, number> {
  return { ...EXCHANGE_RATES };
}

// =============================================================================
// GOLD PRICE FUNCTIONS
// =============================================================================

/**
 * Get current gold price per gram in specified currency
 *
 * @param currency - Target currency (default: USD)
 * @returns Gold price per gram
 *
 * @example
 * const priceInEUR = await getGoldPricePerGram('EUR');
 */
export async function getGoldPricePerGram(
  currency: Currency = "USD"
): Promise<number> {
  const priceInUSD = GOLD_PRICE_PER_GRAM_USD;

  if (currency === "USD") {
    return priceInUSD;
  }

  const convertedPrice = await convertCurrency(priceInUSD, "USD", currency);
  return Math.round(convertedPrice * 100) / 100;
}

/**
 * Get gold price per ounce (1 oz = 31.1035 grams)
 *
 * @param currency - Target currency (default: USD)
 * @returns Gold price per ounce
 *
 * @example
 * const pricePerOz = await getGoldPricePerOunce('USD');
 */
export async function getGoldPricePerOunce(
  currency: Currency = "USD"
): Promise<number> {
  const pricePerGram = await getGoldPricePerGram(currency);
  return Math.round(pricePerGram * 31.1035 * 100) / 100;
}

/**
 * Calculate total cost for buying gold
 *
 * @param grams - Amount of gold in grams
 * @param currency - Currency for payment
 * @returns Object with breakdown of costs
 *
 * @example
 * const cost = await calculateBuyGoldCost(10, 'USD');
 */
export async function calculateBuyGoldCost(
  grams: number,
  currency: Currency
): Promise<{
  grams: number;
  pricePerGram: number;
  subtotal: number;
  fee: number;
  feePercentage: number;
  total: number;
  currency: Currency;
}> {
  const pricePerGram = await getGoldPricePerGram(currency);
  const subtotal = Math.round(grams * pricePerGram * 100) / 100;

  // Fee: 2% of transaction
  const feePercentage = 0.02;
  const fee = Math.round(subtotal * feePercentage * 100) / 100;

  const total = Math.round((subtotal + fee) * 100) / 100;

  return {
    grams,
    pricePerGram,
    subtotal,
    fee,
    feePercentage,
    total,
    currency,
  };
}

/**
 * Calculate proceeds from selling gold
 *
 * @param grams - Amount of gold in grams
 * @param currency - Currency for proceeds
 * @returns Object with breakdown of proceeds
 *
 * @example
 * const proceeds = await calculateSellGoldProceeds(10, 'USD');
 */
export async function calculateSellGoldProceeds(
  grams: number,
  currency: Currency
): Promise<{
  grams: number;
  pricePerGram: number;
  subtotal: number;
  fee: number;
  feePercentage: number;
  netProceeds: number;
  currency: Currency;
}> {
  const pricePerGram = await getGoldPricePerGram(currency);
  const subtotal = Math.round(grams * pricePerGram * 100) / 100;

  // Fee: 1.5% of transaction (lower fee for selling)
  const feePercentage = 0.015;
  const fee = Math.round(subtotal * feePercentage * 100) / 100;

  const netProceeds = Math.round((subtotal - fee) * 100) / 100;

  return {
    grams,
    pricePerGram,
    subtotal,
    fee,
    feePercentage,
    netProceeds,
    currency,
  };
}

// =============================================================================
// DELIVERY COST CALCULATION
// =============================================================================

/**
 * Calculate cost for physical gold delivery
 *
 * @param grams - Amount of gold in grams
 * @param deliveryMethod - Delivery method (standard, express, insured)
 * @param currency - Currency for cost
 * @returns Delivery cost
 *
 * @example
 * const cost = await calculateDeliveryCost(10, 'standard', 'USD');
 */
export async function calculateDeliveryCost(
  grams: number,
  deliveryMethod: "standard" | "express" | "insured",
  currency: Currency
): Promise<number> {
  // Base cost in USD
  let baseCost = 0;

  if (deliveryMethod === "standard") {
    baseCost = 25;
  } else if (deliveryMethod === "express") {
    baseCost = 50;
  } else if (deliveryMethod === "insured") {
    // Insured delivery costs more for higher gold values
    const goldValue = grams * GOLD_PRICE_PER_GRAM_USD;
    baseCost = 75 + goldValue * 0.01; // 1% of gold value
  }

  // Convert to target currency
  const costInCurrency = await convertCurrency(baseCost, "USD", currency);
  return Math.round(costInCurrency * 100) / 100;
}

// =============================================================================
// TRANSACTION FEES
// =============================================================================

/**
 * Calculate deposit fee
 *
 * @param amount - Deposit amount
 * @param paymentMethod - Payment method
 * @returns Fee amount
 *
 * @example
 * const fee = calculateDepositFee(1000, 'bank_transfer');
 */
export function calculateDepositFee(
  amount: number,
  paymentMethod:
    | "bank_transfer"
    | "credit_card"
    | "debit_card"
    | "wire_transfer"
    | "crypto"
): number {
  let feePercentage = 0;

  switch (paymentMethod) {
    case "bank_transfer":
      feePercentage = 0; // Free
      break;
    case "credit_card":
      feePercentage = 0.029; // 2.9%
      break;
    case "debit_card":
      feePercentage = 0.015; // 1.5%
      break;
    case "wire_transfer":
      feePercentage = 0; // Free
      break;
    case "crypto":
      feePercentage = 0.01; // 1%
      break;
  }

  return Math.round(amount * feePercentage * 100) / 100;
}

/**
 * Calculate withdrawal fee
 *
 * @param amount - Withdrawal amount
 * @param paymentMethod - Payment method
 * @returns Fee amount
 *
 * @example
 * const fee = calculateWithdrawalFee(1000, 'bank_transfer');
 */
export function calculateWithdrawalFee(
  amount: number,
  paymentMethod: "bank_transfer" | "wire_transfer" | "crypto"
): number {
  let fee = 0;

  switch (paymentMethod) {
    case "bank_transfer":
      fee = 5; // Flat fee
      break;
    case "wire_transfer":
      fee = 25; // Flat fee
      break;
    case "crypto":
      fee = amount * 0.01; // 1%
      break;
  }

  return Math.round(fee * 100) / 100;
}

// =============================================================================
// PROFIT/LOSS CALCULATION
// =============================================================================

/**
 * Calculate profit or loss from gold investment
 *
 * @param grams - Amount of gold
 * @param averagePurchasePrice - Average price paid per gram
 * @param currentPrice - Current price per gram (optional)
 * @returns Object with profit/loss info
 *
 * @example
 * const pl = await calculateProfitLoss(10, 60);
 */
export async function calculateProfitLoss(
  grams: number,
  averagePurchasePrice: number,
  currentPrice?: number
): Promise<{
  totalInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}> {
  const totalInvestment = Math.round(grams * averagePurchasePrice * 100) / 100;

  const price = currentPrice || (await getGoldPricePerGram("USD"));
  const currentValue = Math.round(grams * price * 100) / 100;

  const profitLoss = Math.round((currentValue - totalInvestment) * 100) / 100;

  const profitLossPercentage =
    totalInvestment > 0
      ? Math.round((profitLoss / totalInvestment) * 10000) / 100
      : 0;

  return {
    totalInvestment,
    currentValue,
    profitLoss,
    profitLossPercentage,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate if amount is within acceptable range
 *
 * @param amount - Amount to validate
 * @param type - Transaction type
 * @returns Validation result
 *
 * @example
 * const result = validateTransactionAmount(100, 'deposit');
 */
export function validateTransactionAmount(
  amount: number,
  type: "deposit" | "withdrawal" | "gold_purchase" | "gold_sale"
): { isValid: boolean; message?: string } {
  const limits = {
    deposit: { min: 10, max: 100000 },
    withdrawal: { min: 10, max: 50000 },
    gold_purchase: { min: 1, max: 1000 }, // in grams
    gold_sale: { min: 1, max: 1000 }, // in grams
  };

  const limit = limits[type];

  if (amount < limit.min) {
    return {
      isValid: false,
      message: `Minimum ${type.replace("_", " ")} amount is ${limit.min}`,
    };
  }

  if (amount > limit.max) {
    return {
      isValid: false,
      message: `Maximum ${type.replace("_", " ")} amount is ${limit.max}`,
    };
  }

  return { isValid: true };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format gold amount with proper precision
 *
 * @param grams - Amount in grams
 * @returns Formatted string
 *
 * @example
 * formatGoldAmount(10.123456) // => "10.12g"
 */
export function formatGoldAmount(grams: number): string {
  return `${grams.toFixed(2)}g`;
}

/**
 * Format currency amount
 *
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string
 *
 * @example
 * formatCurrencyAmount(1234.56, 'USD') // => "$1,234.56"
 */
export function formatCurrencyAmount(
  amount: number,
  currency: Currency
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// At the very end of the file, add:

/**
 * Format currency (alias for formatCurrencyAmount)
 */
export function formatCurrency(amount: number, currency: Currency): string {
  return formatCurrencyAmount(amount, currency);
}
