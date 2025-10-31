// /types/index.ts
// UPDATED - Comprehensive TypeScript Types for GALLA.GOLD Application
// Purpose: Central type definitions to eliminate TypeScript errors and provide type safety

// =============================================================================
// USER TYPES
// =============================================================================

/**
 * User authentication and profile types
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name: string; // Added for Next-Auth compatibility
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  hasMFA: boolean; // Alias for mfaEnabled
  kycStatus: KYCStatus;
  preferredCurrency: Currency;
  preferredLanguage: Locale;
  locale: string; // Added for Next-Auth compatibility
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
}

/**
 * Session user type (minimal data stored in session)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  role: UserRole;
  hasMFA: boolean;
  kycStatus: KYCStatus;
  locale: string;
}

/**
 * User roles
 */
export type UserRole = "user" | "admin";

/**
 * KYC verification status - UPDATED with 'submitted'
 */
export type KYCStatus = "none" | "pending" | "submitted" | "verified" | "rejected";

/**
 * Supported locales
 */
export type Locale = "en" | "es" | "fr" | "ru" | "ar";

// =============================================================================
// WALLET TYPES
// =============================================================================

/**
 * Supported currencies
 */
export type Currency = "USD" | "EUR" | "GBP" | "EGP" | "AED" | "SAR";

/**
 * Multi-currency balance record - UPDATED with index signature
 */
export interface Balance {
  USD: number;
  EUR: number;
  GBP: number;
  EGP: number;
  AED: number;
  SAR: number;
  [key: string]: number; // Allow dynamic access
}

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
 * Complete wallet state
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: Balance;
  gold: GoldHoldings;
  totalValueUSD: number;
  dailyLimits: DailyLimits;
  usedToday: UsedLimits;
  isActive: boolean;
  isFrozen: boolean;
  frozenReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily transaction limits (in USD)
 */
export interface DailyLimits {
  deposit: number;
  withdrawal: number;
  goldPurchase: number;
  goldSale: number;
}

/**
 * Used daily limits tracking
 */
export interface UsedLimits {
  deposit: number;
  withdrawal: number;
  goldPurchase: number;
  goldSale: number;
  lastReset: Date;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

/**
 * Transaction types - UPDATED with gold_purchase and gold_sale
 */
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "gold_purchase"    // ADDED
  | "gold_sale"        // ADDED
  | "buy_gold"
  | "sell_gold"
  | "conversion"
  | "delivery"
  | "fee"
  | "refund";

/**
 * Transaction status
 */
export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  description: string;
  metadata?: Record<string, any>;
  fee?: number;
  
  // Gold-specific fields
  goldGrams?: number;
  goldPricePerGram?: number;
  
  // Reference IDs
  referenceId?: string;
  externalId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Error tracking
  errorMessage?: string;
  errorCode?: string;
}

// =============================================================================
// GOLD TYPES
// =============================================================================

/**
 * Gold price information
 */
export interface GoldPrice {
  spotPrice: number;
  buyPrice: number;
  sellPrice: number;
  pricePerGram: number; // Added for backward compatibility
  currency: Currency;
  lastUpdated: Date;
  change24h?: number;
  changePercentage24h?: number;
}

/**
 * Gold purchase calculation
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
 * Gold sale calculation
 */
export interface GoldSaleCalculation {
  grams: number;
  pricePerGram: number;
  subtotal: number;
  fee: number;
  feePercentage: number;
  netProceeds: number;
  total?: number; // Added for backward compatibility
  currency: Currency;
}

// =============================================================================
// DELIVERY TYPES
// =============================================================================

/**
 * Delivery address
 */
export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

/**
 * Delivery status
 */
export type DeliveryStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "failed";

/**
 * Delivery cost calculation - UPDATED structure
 */
export interface DeliveryCost {
  cost: number;
  currency: Currency;
  estimatedDays: number;
}

/**
 * Delivery request
 */
export interface DeliveryRequest {
  id: string;
  userId: string;
  goldGrams: number;
  address: DeliveryAddress;
  status: DeliveryStatus;
  cost: number; // Also support flat number for backward compatibility
  currency: Currency;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// KYC TYPES
// =============================================================================

/**
 * KYC document type
 */
export type KYCDocumentType =
  | "passport"
  | "drivers_license"
  | "national_id"
  | "proof_of_address"
  | "selfie";

/**
 * Document status - UPDATED
 */
export type DocumentStatus = "pending" | "approved" | "rejected";

/**
 * KYC document
 */
export interface KYCDocument {
  id: string;
  type: KYCDocumentType;
  documentType: string; // Added for backward compatibility
  url: string;
  status: DocumentStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

/**
 * KYC submission
 */
export interface KYCSubmission {
  userId: string;
  status: KYCStatus;
  documents: KYCDocument[];
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

// =============================================================================
// MFA TYPES
// =============================================================================

/**
 * MFA method
 */
export type MFAMethod = "totp" | "sms" | "email";

/**
 * MFA setup
 */
export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * MFA verification
 */
export interface MFAVerification {
  method: MFAMethod;
  code: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// ACTION RESPONSE TYPE
// =============================================================================

/**
 * Standard API response type
 */
export interface ActionResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Notification type
 */
export type NotificationType =
  | "transaction"
  | "kyc"
  | "security"
  | "promotion"
  | "system";

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

// =============================================================================
// CHART TYPES
// =============================================================================

/**
 * Chart data point
 */
export interface ChartDataPoint {
  timestamp: Date | string;
  value: number;
  label?: string;
}

/**
 * Chart configuration
 */
export interface ChartConfig {
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  colors?: string[];
}

// =============================================================================
// MODAL PROPS TYPES
// =============================================================================

/**
 * Base modal props
 */
export interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Buy gold modal props
 */
export interface BuyGoldModalProps extends BaseModalProps {
  goldPrice: number;
  maxAmount?: number;
}

/**
 * Sell gold modal props
 */
export interface SellGoldModalProps extends BaseModalProps {
  goldPrice: number;
  goldBalance: number;
}

/**
 * Deposit modal props
 */
export interface DepositModalProps extends BaseModalProps {
  preferredCurrency?: Currency;
}

/**
 * Withdrawal modal props
 */
export interface WithdrawalModalProps extends BaseModalProps {
  cashBalance: number;
  preferredCurrency?: Currency;
}

/**
 * Physical delivery modal props
 */
export interface PhysicalDeliveryModalProps extends BaseModalProps {
  goldBalance: number;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Form validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// FILTER & SORT TYPES
// =============================================================================

/**
 * Transaction filter options
 */
export interface TransactionFilters {
  type?: TransactionType[];
  status?: TransactionStatus[];
  currency?: Currency[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Sort options
 */
export interface SortOption {
  field: string;
  order: "asc" | "desc";
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

/**
 * Common component props
 */
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Loading state props
 */
export interface LoadingProps {
  isLoading: boolean;
  loadingText?: string;
}

// =============================================================================
// HELPER TYPE UTILITIES
// =============================================================================

/**
 * Make all properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make all properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Exclude null and undefined from a type
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
