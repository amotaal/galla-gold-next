// /types/index.ts
// Comprehensive TypeScript Types for GALLA.GOLD Application
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
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  kycStatus: "pending" | "submitted" | "verified" | "rejected";
  preferredCurrency: Currency;
  preferredLanguage: Locale;
  createdAt: Date;
  lastLogin?: Date;
}

/**
 * Session user type (minimal data stored in session)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

// =============================================================================
// WALLET TYPES
// =============================================================================

/**
 * Supported currencies
 */
export type Currency = "USD" | "EUR" | "GBP" | "EGP" | "AED" | "SAR";

/**
 * Multi-currency balance record
 */
export type Balance = Record<Currency, number>;

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
 * Daily transaction limits
 */
export interface DailyLimits {
  deposit: number;
  withdrawal: number;
  goldPurchase: number;
  goldSale: number;
}

/**
 * Daily usage tracking
 */
export interface UsedLimits {
  deposit: number;
  withdrawal: number;
  goldPurchase: number;
  goldSale: number;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

// =============================================================================
// TRANSACTION TYPES (UPDATED)
// =============================================================================
/**

Transaction types - with aliases for backward compatibility
*/
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "buy_gold" // Primary
  | "gold_purchase" // Alias for buy_gold
  | "sell_gold" // Primary
  | "gold_sale" // Alias for sell_gold
  | "physical_delivery";

// Export helpers to normalize transaction types
export function normalizeTransactionType(type: string): TransactionType {
  if (type === "gold_purchase") return "buy_gold";
  if (type === "gold_sale") return "sell_gold";
  return type as TransactionType;
}
export function isGoldPurchase(type: TransactionType): boolean {
  return type === "buy_gold" || type === "gold_purchase";
}
export function isGoldSale(type: TransactionType): boolean {
  return type === "sell_gold" || type === "gold_sale";
}

/**
 * Transaction status states
 */
export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

/**
 * Payment methods
 */
export type PaymentMethod =
  | "bank_transfer"
  | "credit_card"
  | "debit_card"
  | "wire_transfer"
  | "crypto";

/**
 * Complete transaction object
 */
export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;
  goldAmount?: number;
  goldPricePerGram?: number;
  paymentMethod?: PaymentMethod;
  paymentProvider?: string;
  paymentReference?: string;
  description: string;
  deliveryAddress?: DeliveryAddress;
  trackingNumber?: string;
  errorMessage?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  updatedAt: Date;
}

/**
 * Delivery address for physical gold
 */
export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

// =============================================================================
// KYC TYPES
// =============================================================================

/**
 * KYC verification status
 */
export type KYCStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "verified"
  | "rejected";

/**
 * KYC document type
 */
export type KYCDocumentType =
  | "passport"
  | "drivers_license"
  | "national_id"
  | "proof_of_address";

/**
 * KYC document
 */
export interface KYCDocument {
  type: KYCDocumentType;
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
}

/**
 * Complete KYC information
 */
export interface KYC {
  id: string;
  userId: string;
  status: KYCStatus;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  address: DeliveryAddress;
  documents: KYCDocument[];
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  reviewedBy?: string;
  notes?: string;
}

// =============================================================================
// GOLD PRICE TYPES
// =============================================================================

/**
 * Current gold price information
 */
export interface GoldPrice {
  pricePerGram: number;
  pricePerOunce: number;
  currency: Currency;
  timestamp: Date;
  change24h: number;
  changePercentage24h: number;
  high24h: number;
  low24h: number;
}

/**
 * Historical gold price data point
 */
export interface GoldPriceHistoryPoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

/**
 * Gold price chart data
 */
export interface GoldPriceChart {
  timeframe: "24h" | "7d" | "30d" | "90d" | "1y" | "all";
  data: GoldPriceHistoryPoint[];
  min: number;
  max: number;
  average: number;
}

// =============================================================================
// MFA TYPES
// =============================================================================

/**
 * MFA setup data
 */
export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * MFA verification request
 */
export interface MFAVerification {
  code: string;
  backupCode?: boolean;
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

/**
 * Signup form data
 */
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
}

/**
 * Profile update form data
 */
export interface ProfileUpdateFormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Partial<DeliveryAddress>;
  preferredCurrency?: Currency;
  preferredLanguage?: Locale;
}

/**
 * Password change form data
 */
export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Deposit form data
 */
export interface DepositFormData {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
}

/**
 * Withdrawal form data
 */
export interface WithdrawalFormData {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  bankAccount?: string;
}

/**
 * Buy gold form data
 */
export interface BuyGoldFormData {
  grams: number;
  currency: Currency;
  totalCost: number;
}

/**
 * Sell gold form data
 */
export interface SellGoldFormData {
  grams: number;
  currency: Currency;
  expectedProceeds: number;
}

/**
 * Physical delivery form data
 */
export interface PhysicalDeliveryFormData {
  grams: number;
  deliveryAddress: DeliveryAddress;
  deliveryMethod: "standard" | "express" | "insured";
  estimatedDeliveryCost: number;
}

// =============================================================================
// I18N TYPES
// =============================================================================

/**
 * Supported locales
 */
export type Locale = "en" | "es" | "fr" | "ru" | "ar";

/**
 * Translation key-value pairs
 */
export type Translations = Record<string, string>;

/**
 * I18n context type
 */
export interface I18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isRTL: boolean;
  isLoading: boolean;
}

// =============================================================================
// THEME TYPES
// =============================================================================

/**
 * Theme mode
 */
export type Theme = "light" | "dark" | "system";

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Combined API response type
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Server action response type
 */
export type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

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
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// STATISTICS TYPES
// =============================================================================

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  totalTransactions: number;
  goldGrams: number;
  cashBalance: number;
}

/**
 * Transaction statistics
 */
export interface TransactionStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalGoldPurchases: number;
  totalGoldSales: number;
  totalFees: number;
  averageTransactionSize: number;
}

/**
 * Portfolio performance
 */
export interface PortfolioPerformance {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  allTime: number;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/**
 * Notification type
 */
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "transaction"
  | "kyc"
  | "security";

/**
 * Notification object
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
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

/**
 * Error state props
 */
export interface ErrorProps {
  error: string | null;
  onRetry?: () => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: DeepRequired<T[P]>;
};

/**
 * Omit multiple keys from type
 */
export type OmitMultiple<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
