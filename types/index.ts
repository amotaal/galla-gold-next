// types/index.ts
// ============================================================================
// COMPREHENSIVE TYPE DEFINITIONS FOR GALLA.GOLD APPLICATION
// ============================================================================
// Purpose: Central type definitions for the entire application
// Eliminates TypeScript errors and provides complete type safety

// =============================================================================
// USER & AUTHENTICATION TYPES
// =============================================================================

/**
 * User roles in the system
 */
export type UserRole = "user" | "admin";

/**
 * KYC (Know Your Customer) verification status
 * ✅ FIXED: Added "none" for new users
 */
export type KYCStatus =
  | "none" // User hasn't started KYC
  | "pending" // KYC initiated but not submitted
  | "submitted" // Documents submitted, awaiting review
  | "verified" // KYC approved
  | "rejected"; // KYC rejected

/**
 * Supported locales/languages
 */
export type Locale = "en" | "es" | "fr" | "ru" | "ar";

/**
 * Complete user profile interface
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name: string; // For Next-Auth compatibility
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  address?: Address;

  // Authentication
  emailVerified: boolean; // In database: boolean
  // Note: Next-Auth needs Date | null - conversion happens in auth config

  // Security
  mfaEnabled: boolean;
  hasMFA: boolean; // Alias for compatibility

  // Verification
  kycStatus: KYCStatus;
  kycSubmittedAt?: Date;
  kycVerifiedAt?: Date;

  // Preferences
  preferredCurrency: Currency;
  preferredLanguage: Locale;
  locale: string;
  timezone: string;

  // Role
  role: UserRole;

  // Status
  isActive: boolean;
  isSuspended: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * Session user (minimal data in session token)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  emailVerified: Date | null; // Next-Auth format
  role: UserRole;
  hasMFA: boolean;
  kycStatus: KYCStatus;
  locale: string;
  avatar?: string;
  phone?: string;
}

/**
 * Address structure
 */
export interface Address {
  street?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// =============================================================================
// CURRENCY & FINANCIAL TYPES
// =============================================================================

/**
 * Supported currencies
 */
export type Currency = "USD" | "EUR" | "GBP" | "EGP" | "AED" | "SAR";

/**
 * Multi-currency balance record
 * ✅ FIXED: Added index signature for dynamic access
 */
export interface Balance {
  USD: number;
  EUR: number;
  GBP: number;
  EGP: number;
  AED: number;
  SAR: number;
  [key: string]: number; // ✅ Allows: wallet.balance[currency]
}

/**
 * Currency conversion rate
 */
export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: Date;
}

// =============================================================================
// WALLET TYPES
// =============================================================================

/**
 * Gold holdings information
 */
export interface GoldHoldings {
  grams: number;
  averagePurchasePrice: number;
  currentValue: number;
  totalInvestment: number;
  profitLoss: number;
  profitLossPercentage: number;
}

/**
 * Daily transaction limits (in USD equivalent)
 */
export interface DailyLimits {
  deposit: number;
  withdrawal: number;
  goldPurchase: number;
  goldSale: number;
  conversion: number;
}

/**
 * Used daily limits tracking
 */
export interface UsedLimits {
  deposit: number;
  withdrawal: number;
  goldPurchase: number;
  goldSale: number;
  conversion: number;
  lastReset: Date;
}

/**
 * Lifetime transaction usage tracking
 */
export interface LifetimeUsage {
  totalDeposits: number;
  totalWithdrawals: number;
  totalGoldPurchases: number;
  totalGoldSales: number;
  totalConversions: number;
}

/**
 * Complete wallet interface
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: Balance;
  gold: GoldHoldings;
  totalValueUSD: number;
  dailyLimits: DailyLimits;
  usedToday: UsedLimits;
  lifetimeUsage: LifetimeUsage;
  isActive: boolean;
  isFrozen: boolean;
  frozenReason?: string;
  frozenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

/**
 * Transaction types supported by the platform
 * ✅ FIXED: Added "gold_purchase" and "gold_sale" to fix comparison errors
 */
export type TransactionType =
  | "deposit" // Add funds to wallet
  | "withdrawal" // Withdraw funds from wallet
  | "buy_gold" // Purchase gold (alternative name)
  | "sell_gold" // Sell gold (alternative name)
  | "gold_purchase" // ✅ Purchase gold (used in actions)
  | "gold_sale" // ✅ Sell gold (used in actions)
  | "conversion" // Convert between currencies
  | "delivery" // Physical gold delivery
  | "physical_delivery" // Physical gold delivery (alternative)
  | "fee" // Transaction fee
  | "refund"; // Refund transaction

/**
 * Transaction status
 */
export type TransactionStatus =
  | "pending" // Initiated but not processed
  | "processing" // Being processed
  | "completed" // Successfully completed
  | "failed" // Failed
  | "cancelled" // Cancelled by user or system
  | "refunded"; // Refunded to user

/**
 * Payment methods for deposits/withdrawals
 */
export type PaymentMethod =
  | "bank_transfer"
  | "credit_card"
  | "debit_card"
  | "wire_transfer"
  | "crypto";

/**
 * Complete transaction interface
 */
export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;

  // Amounts
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;

  // Gold-specific (for gold trades)
  goldAmount?: number;
  goldGrams?: number; // Alias
  goldPricePerGram?: number;

  // Payment details
  paymentMethod?: PaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;

  // Delivery details (for physical gold)
  deliveryAddress?: Address;
  trackingNumber?: string;

  // Status tracking
  statusHistory: TransactionStatusHistory[];

  // Error handling
  errorMessage?: string;
  errorCode?: string;

  // Metadata
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  refundedAt?: Date;
}

/**
 * Transaction status history entry
 */
export interface TransactionStatusHistory {
  status: TransactionStatus;
  timestamp: Date;
  note?: string;
}

/**
 * Transaction summary for analytics
 */
export interface TransactionSummary {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalGoldPurchases: number;
  totalGoldSales: number;
  totalFees: number;
  totalVolume: number;
  currency: Currency;
  periodStart: Date;
  periodEnd: Date;
}

// =============================================================================
// GOLD PRICE TYPES
// =============================================================================

/**
 * Current gold price information
 * ✅ FIXED: Added pricePerGram property
 */
export interface GoldPrice {
  currency: Currency;
  spotPrice: number;
  buyPrice: number;
  sellPrice: number;
  pricePerGram: number; // ✅ Added for compatibility
  spread: number;
  spreadPercentage: number;
  lastUpdated: Date;
  change24h?: number;
  changePercentage24h?: number;
}

/**
 * Gold price history entry
 */
export interface GoldPriceHistory {
  timestamp: Date;
  price: number;
  currency: Currency;
}

/**
 * Gold purchase cost calculation
 */
export interface GoldPurchaseCalculation {
  grams: number;
  pricePerGram: number;
  subtotal: number;
  fee: number;
  feePercentage: number;
  total: number;
  currency: Currency;
}

/**
 * Gold sale proceeds calculation
 * ✅ FIXED: Added total property for compatibility
 */
export interface GoldSaleCalculation {
  grams: number;
  pricePerGram: number;
  subtotal: number;
  fee: number;
  feePercentage: number;
  netProceeds: number;
  total: number; // ✅ Added (same as netProceeds)
  currency: Currency;
}

/**
 * Physical gold delivery cost
 * Note: This should be just a number, not an object with .cost property
 */
export type DeliveryCost = number; // ✅ Fixed: number, not { cost: number }

// =============================================================================
// KYC (KNOW YOUR CUSTOMER) TYPES
// =============================================================================

/**
 * KYC document types
 */
export type DocumentType =
  | "passport"
  | "national_id"
  | "drivers_license"
  | "proof_of_address"
  | "selfie";

/**
 * Document verification status
 */
export type DocumentStatus = "pending" | "approved" | "rejected";

/**
 * KYC document information
 * ✅ FIXED: Added documentType and status properties
 */
export interface KYCDocument {
  type: DocumentType;
  documentType: DocumentType; // ✅ Alias for backward compatibility
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: DocumentStatus; // ✅ Added status property
  rejectionReason?: string;
}

/**
 * Personal information for KYC
 */
export interface PersonalInfo {
  fullName: string;
  dateOfBirth: Date;
  nationality: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phoneNumber?: string;
}

/**
 * Complete KYC record
 */
export interface KYC {
  id: string;
  userId: string;
  status: KYCStatus;
  personalInfo: PersonalInfo;
  documents: KYCDocument[];

  // Identity document details
  idType: "passport" | "national_id" | "drivers_license";
  idNumber: string;
  idIssueDate?: Date;
  idExpiryDate?: Date;
  idIssuingCountry: string;

  // Verification details
  submittedAt?: Date;
  reviewedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;

  // Review information
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;

  // Risk assessment
  riskLevel?: "low" | "medium" | "high";
  riskNotes?: string;

  // Compliance
  requiresManualReview: boolean;
  flaggedForReview: boolean;
  flagReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// MFA (MULTI-FACTOR AUTHENTICATION) TYPES
// =============================================================================

/**
 * MFA methods supported
 */
export type MFAMethod = "totp" | "sms" | "email";

/**
 * MFA backup code
 * ✅ FIXED: Proper interface instead of just string
 */
export interface MFABackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
  usedIp?: string;
}

/**
 * MFA verification attempt
 */
export interface MFAVerificationAttempt {
  method: MFAMethod;
  success: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Complete MFA record
 * ✅ FIXED: failedAttempts is number, backupCodes is array of objects
 */
export interface MFA {
  id: string;
  userId: string;
  enabled: boolean;
  secret: string;
  backupCodes: MFABackupCode[]; // ✅ Fixed type
  method: MFAMethod;
  verified: boolean;
  verifiedAt?: Date; // ✅ Added property

  // Security
  failedAttempts: number; // ✅ Fixed: number, not Date
  lockedUntil?: Date;
  lastVerifiedAt?: Date;

  // History
  verificationHistory: MFAVerificationAttempt[];

  // Timestamps
  enabledAt?: Date;
  disabledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response structure
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: Date;
}

/**
 * Action response (for server actions)
 */
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

// =============================================================================
// FORM & VALIDATION TYPES
// =============================================================================

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Notification types
 */
export type NotificationType = "info" | "success" | "warning" | "error";

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
}

// =============================================================================
// STATISTICS & ANALYTICS TYPES
// =============================================================================

/**
 * User statistics
 */
export interface UserStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalGoldPurchases: number;
  totalGoldSales: number;
  totalFees: number;
  goldHoldings: number;
  portfolioValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

/**
 * Platform statistics (admin view)
 */
export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalGoldHoldings: number;
  totalRevenue: number;
  currency: Currency;
  periodStart: Date;
  periodEnd: Date;
}

// =============================================================================
// THEME & UI TYPES
// =============================================================================

/**
 * Theme modes
 */
export type Theme = "light" | "dark" | "system";

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: "default" | "destructive";
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// =============================================================================
// RE-EXPORTS
// =============================================================================

export type {
  User as IUser,
  Wallet as IWallet,
  Transaction as ITransaction,
  KYC as IKYC,
  MFA as IMFA,
};
