// /lib/constants.ts
// Application Constants for GALLA.GOLD
// Purpose: Centralized configuration values used throughout the application
// All constants are strongly typed for better IDE support and type safety

// =============================================================================
// SUPPORTED CURRENCIES
// =============================================================================

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
} as const;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as Array<keyof typeof CURRENCIES>;

// Default currency
export const DEFAULT_CURRENCY = 'USD';

// =============================================================================
// SUPPORTED LOCALES
// =============================================================================

export const LOCALES = {
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
} as const;

export const LOCALE_CODES = Object.keys(LOCALES) as Array<keyof typeof LOCALES>;

// Default locale
export const DEFAULT_LOCALE = 'en';

// RTL locales
export const RTL_LOCALES = ['ar'];

// =============================================================================
// TRANSACTION LIMITS
// =============================================================================

export const LIMITS = {
  // Daily limits (in USD)
  DAILY_DEPOSIT: 50000,
  DAILY_WITHDRAWAL: 50000,
  DAILY_TRADING: 100000,
  
  // Single transaction limits (in USD)
  MIN_DEPOSIT: 10,
  MAX_DEPOSIT: 50000,
  MIN_WITHDRAWAL: 10,
  MAX_WITHDRAWAL: 50000,
  
  // Gold trading limits (in grams)
  MIN_GOLD_PURCHASE: 0.1,
  MAX_GOLD_PURCHASE: 1000,
  MIN_GOLD_SALE: 0.1,
  MAX_GOLD_SALE: 1000,
  
  // Physical delivery limits (in grams)
  MIN_PHYSICAL_DELIVERY: 10,
  MAX_PHYSICAL_DELIVERY: 100,
} as const;

// =============================================================================
// TRANSACTION FEES
// =============================================================================

export const FEES = {
  // Trading fees (percentage)
  GOLD_PURCHASE_FEE: 0.02,  // 2%
  GOLD_SALE_FEE: 0.02,       // 2%
  
  // Deposit/withdrawal fees (percentage)
  DEPOSIT_FEE: 0,            // Free
  WITHDRAWAL_FEE: 0.01,      // 1%
  
  // Physical delivery fees (flat rate in USD)
  PHYSICAL_DELIVERY_FEE: 50,
  
  // International wire transfer fee
  WIRE_TRANSFER_FEE: 25,
} as const;

// =============================================================================
// KYC & VERIFICATION
// =============================================================================

export const KYC = {
  // KYC status values
  STATUS: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },
  
  // Document types
  DOCUMENT_TYPES: {
    PASSPORT: 'passport',
    NATIONAL_ID: 'national_id',
    DRIVERS_LICENSE: 'drivers_license',
    PROOF_OF_ADDRESS: 'proof_of_address',
    SELFIE: 'selfie',
  },
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  
  // Verification expiry
  EXPIRY_DAYS: 365, // KYC valid for 1 year
  RENEWAL_WARNING_DAYS: 30, // Warn user 30 days before expiry
} as const;

// =============================================================================
// AUTHENTICATION & SECURITY
// =============================================================================

export const AUTH = {
  // Password requirements
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  
  // Session configuration
  SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  
  // Token expiry
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in ms
  RESET_TOKEN_EXPIRY: 24 * 60 * 60 * 1000,        // 24 hours in ms
  MAGIC_LINK_EXPIRY: 15 * 60 * 1000,              // 15 minutes in ms
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCK_DURATION: 15 * 60 * 1000, // 15 minutes in ms
  
  // MFA
  MFA_CODE_LENGTH: 6,
  MFA_BACKUP_CODES_COUNT: 10,
  MAX_MFA_ATTEMPTS: 5,
  MFA_LOCK_DURATION: 15 * 60 * 1000, // 15 minutes in ms
} as const;

// =============================================================================
// GOLD MARKET DATA
// =============================================================================

export const GOLD = {
  // Price update intervals
  PRICE_UPDATE_INTERVAL: 5000, // 5 seconds in ms
  
  // Chart intervals
  INTERVALS: {
    '1M': '1m',
    '5M': '5m',
    '15M': '15m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
    '1W': '1w',
  },
  
  // Default chart settings
  DEFAULT_CHART_INTERVAL: '1h',
  DEFAULT_CHART_LIMIT: 24, // 24 data points
  
  // Metal types
  METALS: {
    GOLD: 'gold',
    SILVER: 'silver',
    PLATINUM: 'platinum',
    PALLADIUM: 'palladium',
  },
} as const;

// =============================================================================
// PAGINATION & DATA LIMITS
// =============================================================================

export const PAGINATION = {
  // Default page sizes
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Transaction history
  TRANSACTIONS_PER_PAGE: 20,
  MAX_TRANSACTIONS: 1000,
  
  // Price history
  PRICE_HISTORY_LIMIT: 100,
  MAX_PRICE_HISTORY: 1000,
} as const;

// =============================================================================
// UI & DISPLAY
// =============================================================================

export const UI = {
  // Theme
  DEFAULT_THEME: 'dark',
  THEMES: ['light', 'dark'] as const,
  
  // Toast duration
  TOAST_DURATION: 5000, // 5 seconds
  
  // Loading delays
  MIN_LOADING_TIME: 500, // Minimum loading spinner time
  
  // Animation durations
  ANIMATION_DURATION: 300, // 300ms
  
  // Mobile breakpoint
  MOBILE_BREAKPOINT: 768, // pixels
} as const;

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export const EMAIL = {
  // From address
  FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@gallagold.com',
  FROM_NAME: process.env.RESEND_FROM_NAME || 'GALLA.GOLD',
  
  // Template subjects
  SUBJECTS: {
    VERIFICATION: 'Verify Your Email - GALLA.GOLD',
    MAGIC_LINK: 'Your Magic Link - GALLA.GOLD',
    RESET_PASSWORD: 'Reset Your Password - GALLA.GOLD',
    WELCOME: 'Welcome to GALLA.GOLD!',
    KYC_APPROVED: 'KYC Verification Approved',
    KYC_REJECTED: 'KYC Verification Rejected',
    TRANSACTION_COMPLETE: 'Transaction Complete',
    MFA_ENABLED: '2FA Enabled on Your Account',
  },
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const ERRORS = {
  // Generic
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'You must be logged in to access this page.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Your account has been locked due to too many failed login attempts.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing.',
  INVALID_TOKEN: 'Invalid or expired token.',
  
  // Transactions
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete this transaction.',
  DAILY_LIMIT_EXCEEDED: 'Daily transaction limit exceeded.',
  INVALID_AMOUNT: 'Invalid transaction amount.',
  
  // KYC
  KYC_NOT_VERIFIED: 'Please complete KYC verification to access this feature.',
  KYC_ALREADY_SUBMITTED: 'KYC verification is already submitted.',
  
  // MFA
  INVALID_MFA_CODE: 'Invalid 2FA code.',
  MFA_REQUIRED: '2FA verification required.',
  
  // File upload
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type.',
} as const;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

export const SUCCESS = {
  // Authentication
  LOGIN_SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  EMAIL_VERIFIED: 'Email verified successfully!',
  PASSWORD_RESET: 'Password reset successfully!',
  
  // Transactions
  DEPOSIT_SUCCESS: 'Deposit completed successfully!',
  WITHDRAWAL_SUCCESS: 'Withdrawal completed successfully!',
  GOLD_PURCHASE_SUCCESS: 'Gold purchased successfully!',
  GOLD_SALE_SUCCESS: 'Gold sold successfully!',
  
  // KYC
  KYC_SUBMITTED: 'KYC verification submitted successfully!',
  
  // MFA
  MFA_ENABLED: '2FA enabled successfully!',
  MFA_DISABLED: '2FA disabled successfully!',
  
  // Profile
  PROFILE_UPDATED: 'Profile updated successfully!',
  PREFERENCES_UPDATED: 'Preferences updated successfully!',
} as const;

// =============================================================================
// API ENDPOINTS (for future external APIs)
// =============================================================================

export const API_ENDPOINTS = {
  // Gold price API
  GOLD_PRICE: process.env.GOLD_PRICE_API_URL || 'https://api.metals.live/v1/spot',
  
  // Payment processor
  PAYMENT_API: process.env.PAYMENT_API_URL || '',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Currency = keyof typeof CURRENCIES;
export type Locale = keyof typeof LOCALES;
export type Theme = typeof UI.THEMES[number];
export type KYCStatus = typeof KYC.STATUS[keyof typeof KYC.STATUS];
export type Metal = typeof GOLD.METALS[keyof typeof GOLD.METALS];
