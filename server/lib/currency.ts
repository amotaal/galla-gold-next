// /server/lib/currency.ts
// Currency conversion utilities for multi-currency support and gold price calculations
// Handles exchange rates, currency formatting, and gold price conversions

import { CURRENCIES, GOLD_FEES } from "@/lib/constants";

// ============================================================================
// TYPES
// ============================================================================

type Currency = "USD" | "EUR" | "GBP" | "EGP" | "SAR";

/**
 * Exchange rates structure
 * All rates are relative to USD (base currency)
 */
interface ExchangeRates {
  USD: number; // Always 1.0 (base currency)
  EUR: number;
  GBP: number;
  EGP: number;
  SAR: number;
  lastUpdated: Date;
}

// ============================================================================
// EXCHANGE RATES (Mock - Replace with real API in production)
// ============================================================================

/**
 * Get current exchange rates
 * @returns Promise<ExchangeRates> - Current exchange rates
 * 
 * TODO: In production, integrate with a real forex API:
 * - ExchangeRate-API (https://www.exchangerate-api.com/)
 * - Open Exchange Rates (https://openexchangerates.org/)
 * - Fixer.io (https://fixer.io/)
 * 
 * For now, using approximate rates for development
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // Mock exchange rates (approximate as of October 2024)
  // In production, fetch from a real API and cache for 1 hour
  return {
    USD: 1.0, // Base currency
    EUR: 0.92, // 1 USD = 0.92 EUR
    GBP: 0.79, // 1 USD = 0.79 GBP
    EGP: 49.0, // 1 USD = 49 EGP
    SAR: 3.75, // 1 USD = 3.75 SAR
    lastUpdated: new Date(),
  };
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Promise<number> - Converted amount
 * 
 * Conversion process:
 * 1. Convert from source currency to USD
 * 2. Convert from USD to target currency
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  // If same currency, return as is
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Get current exchange rates
  const rates = await getExchangeRates();

  // Convert to USD first (base currency)
  const amountInUSD = amount / rates[fromCurrency];

  // Convert from USD to target currency
  const convertedAmount = amountInUSD * rates[toCurrency];

  // Round to 2 decimal places for fiat currencies
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Get exchange rate between two currencies
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Promise<number> - Exchange rate
 */
export async function getExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const rates = await getExchangeRates();
  
  // Calculate cross rate via USD
  return (rates[toCurrency] / rates[fromCurrency]);
}

// ============================================================================
// GOLD PRICE CALCULATIONS
// ============================================================================

/**
 * Get current gold price per gram in specified currency
 * @param currency - Target currency
 * @returns Promise<number> - Gold price per gram
 * 
 * TODO: In production, integrate with a real gold price API:
 * - GoldAPI (https://www.goldapi.io/)
 * - Metals-API (https://metals-api.com/)
 * - OANDA (https://www.oanda.com/)
 * 
 * Base price is in USD per troy ounce, converted to per gram
 */
export async function getGoldPricePerGram(currency: Currency): Promise<number> {
  // Mock gold price (approximate as of October 2024)
  // Current spot price: ~$2,650 USD per troy ounce
  const pricePerOunceUSD = 2650;

  // Convert troy ounce to grams (1 troy oz = 31.1034768 grams)
  const pricePerGramUSD = pricePerOunceUSD / 31.1034768;

  // Convert to target currency
  const priceInCurrency = await convertCurrency(pricePerGramUSD, "USD", currency);

  // Round to 2 decimal places
  return Math.round(priceInCurrency * 100) / 100;
}

/**
 * Calculate total cost to buy gold (including fees)
 * @param grams - Amount of gold in grams
 * @param currency - Currency for transaction
 * @returns Promise<object> - Breakdown of costs
 */
export async function calculateBuyGoldCost(
  grams: number,
  currency: Currency
) {
  const pricePerGram = await getGoldPricePerGram(currency);
  const subtotal = grams * pricePerGram;
  
  // Apply buy fee (e.g., 2%)
  const feePercentage = GOLD_FEES.BUY_FEE_PERCENT;
  const fee = subtotal * (feePercentage / 100);
  
  const total = subtotal + fee;

  return {
    grams,
    pricePerGram,
    subtotal: Math.round(subtotal * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    feePercentage,
    total: Math.round(total * 100) / 100,
    currency,
  };
}

/**
 * Calculate total proceeds from selling gold (after fees)
 * @param grams - Amount of gold in grams
 * @param currency - Currency for transaction
 * @returns Promise<object> - Breakdown of proceeds
 */
export async function calculateSellGoldProceeds(
  grams: number,
  currency: Currency
) {
  const pricePerGram = await getGoldPricePerGram(currency);
  const subtotal = grams * pricePerGram;
  
  // Apply sell fee (e.g., 1%)
  const feePercentage = GOLD_FEES.SELL_FEE_PERCENT;
  const fee = subtotal * (feePercentage / 100);
  
  const total = subtotal - fee;

  return {
    grams,
    pricePerGram,
    subtotal: Math.round(subtotal * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    feePercentage,
    total: Math.round(total * 100) / 100,
    currency,
  };
}

/**
 * Calculate physical delivery cost
 * @param grams - Amount of gold in grams
 * @param deliveryType - Type of delivery (standard, express, insured)
 * @param currency - Currency for cost
 * @returns Promise<object> - Delivery cost breakdown
 */
export async function calculateDeliveryCost(
  grams: number,
  deliveryType: "standard" | "express" | "insured",
  currency: Currency
) {
  // Base delivery costs in USD
  const baseCosts = {
    standard: 25, // Flat fee
    express: 50, // Flat fee + faster shipping
    insured: 75, // Includes insurance up to full value
  };

  let baseCost = baseCosts[deliveryType];

  // Add weight-based cost for large orders (>100g)
  if (grams > 100) {
    const extraGrams = grams - 100;
    baseCost += Math.ceil(extraGrams / 100) * 10; // $10 per 100g over base
  }

  // Convert to target currency
  const cost = await convertCurrency(baseCost, "USD", currency);

  return {
    grams,
    deliveryType,
    baseCost: Math.round(baseCost * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    currency,
  };
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format amount as currency string
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns string - Formatted currency string
 * 
 * Examples:
 * - formatCurrency(1234.56, 'USD') => "$1,234.56"
 * - formatCurrency(1234.56, 'EUR') => "€1,234.56"
 * - formatCurrency(1234.56, 'EGP', 'ar-EG') => "١٬٢٣٤٫٥٦ ج.م.‏"
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format gold amount with precision
 * @param grams - Amount in grams
 * @param locale - Locale for formatting
 * @returns string - Formatted gold amount
 * 
 * Examples:
 * - formatGold(10.123456) => "10.123456 g"
 * - formatGold(0.001) => "0.001 g"
 */
export function formatGold(grams: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(grams) + " g";
}

/**
 * Format percentage
 * @param value - Percentage value (e.g., 2.5 for 2.5%)
 * @param locale - Locale for formatting
 * @returns string - Formatted percentage
 */
export function formatPercentage(value: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

// ============================================================================
// CURRENCY UTILITIES
// ============================================================================

/**
 * Get currency symbol
 * @param currency - Currency code
 * @returns string - Currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    EGP: "E£",
    SAR: "﷼",
  };

  return symbols[currency] || currency;
}

/**
 * Get currency name
 * @param currency - Currency code
 * @returns string - Full currency name
 */
export function getCurrencyName(currency: Currency): string {
  return CURRENCIES.find((c) => c.code === currency)?.name || currency;
}

/**
 * Validate currency code
 * @param currency - Currency code to validate
 * @returns boolean - True if valid currency
 */
export function isValidCurrency(currency: string): currency is Currency {
  const validCurrencies: Currency[] = ["USD", "EUR", "GBP", "EGP", "SAR"];
  return validCurrencies.includes(currency as Currency);
}

/**
 * Round to currency precision
 * @param amount - Amount to round
 * @param precision - Decimal places (default 2)
 * @returns number - Rounded amount
 */
export function roundToCurrencyPrecision(
  amount: number,
  precision: number = 2
): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(amount * multiplier) / multiplier;
}

/**
 * Convert grams to troy ounces
 * @param grams - Amount in grams
 * @returns number - Amount in troy ounces
 */
export function gramsToTroyOunces(grams: number): number {
  return grams / 31.1034768;
}

/**
 * Convert troy ounces to grams
 * @param ounces - Amount in troy ounces
 * @returns number - Amount in grams
 */
export function troyOuncesToGrams(ounces: number): number {
  return ounces * 31.1034768;
}
