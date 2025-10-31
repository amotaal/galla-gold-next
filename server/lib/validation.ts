// /server/lib/validation.ts
// Comprehensive Zod validation schemas for all form inputs and server actions
// Provides type-safe validation with detailed error messages

import { z } from "zod";

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Email validation schema
 * - Validates email format
 * - Converts to lowercase
 * - Trims whitespace
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 * - Minimum 8 characters
 * - Must contain uppercase, lowercase, number, and special character
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Name validation schema (first/last name)
 * - 2-50 characters
 * - Only letters, spaces, hyphens, apostrophes
 */
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .trim();

/**
 * Phone number validation schema
 * - International format with country code
 * - E.164 format: +[country code][number]
 */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number. Use international format: +1234567890")
  .trim();

/**
 * Login form validation
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

/**
 * Signup form validation
 */
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema.optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Password reset request validation
 */
export const resetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset validation (with token)
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Email verification validation
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

/**
 * Magic link request validation
 */
export const magicLinkSchema = z.object({
  email: emailSchema,
});

// ============================================================================
// PROFILE & USER SCHEMAS
// ============================================================================

/**
 * Profile update validation
 */
export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z
    .object({
      street: z.string().min(5, "Street address must be at least 5 characters").optional(),
      city: z.string().min(2, "City must be at least 2 characters").optional(),
      state: z.string().min(2, "State/Province must be at least 2 characters").optional(),
      postalCode: z.string().min(3, "Postal code must be at least 3 characters").optional(),
      country: z.string().length(2, "Country code must be 2 characters (ISO 3166-1)").optional(),
    })
    .optional(),
  preferredCurrency: z.enum(["USD", "EUR", "GBP", "EGP", "SAR"]).optional(),
  preferredLanguage: z.enum(["en", "es", "fr", "ru", "ar"]).optional(),
});

/**
 * Password change validation (requires current password)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// ============================================================================
// WALLET & TRANSACTION SCHEMAS
// ============================================================================

/**
 * Currency amount validation
 * - Must be positive
 * - Maximum 2 decimal places for fiat
 * - Maximum 6 decimal places for gold
 */
export const amountSchema = (type: "fiat" | "gold" = "fiat") =>
  z
    .number()
    .positive("Amount must be greater than 0")
    .multipleOf(type === "fiat" ? 0.01 : 0.000001, `Invalid ${type} amount precision`);

/**
 * Deposit request validation
 */
export const depositSchema = z.object({
  amount: amountSchema("fiat"),
  currency: z.enum(["USD", "EUR", "GBP", "EGP", "SAR"]),
  paymentMethod: z.enum(["bank_transfer", "card", "mobile_wallet"]),
});

/**
 * Withdrawal request validation
 */
export const withdrawalSchema = z.object({
  amount: amountSchema("fiat"),
  currency: z.enum(["USD", "EUR", "GBP", "EGP", "SAR"]),
  bankAccount: z.object({
    accountNumber: z.string().min(5, "Account number must be at least 5 characters"),
    bankName: z.string().min(2, "Bank name is required"),
    swiftCode: z.string().min(8, "Valid SWIFT/BIC code required").optional(),
    iban: z.string().min(15, "Valid IBAN required").optional(),
  }),
});

/**
 * Buy gold validation
 */
export const buyGoldSchema = z.object({
  grams: amountSchema("gold"),
  currency: z.enum(["USD", "EUR", "GBP", "EGP", "SAR"]),
  totalAmount: amountSchema("fiat"),
  pricePerGram: amountSchema("fiat"),
});

/**
 * Sell gold validation
 */
export const sellGoldSchema = z.object({
  grams: amountSchema("gold"),
  currency: z.enum(["USD", "EUR", "GBP", "EGP", "SAR"]),
  totalAmount: amountSchema("fiat"),
  pricePerGram: amountSchema("fiat"),
});

/**
 * Physical delivery request validation
 */
export const deliverySchema = z.object({
  grams: amountSchema("gold"),
  deliveryAddress: z.object({
    street: z.string().min(5, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State/Province is required"),
    postalCode: z.string().min(3, "Postal code is required"),
    country: z.string().length(2, "Country code must be 2 characters"),
  }),
  deliveryType: z.enum(["standard", "express", "insured"]),
});

// ============================================================================
// KYC & VERIFICATION SCHEMAS
// ============================================================================

/**
 * KYC document upload validation
 */
export const kycDocumentSchema = z.object({
  documentType: z.enum([
    "passport",
    "drivers_license",
    "national_id",
    "utility_bill",
    "bank_statement",
  ]),
  documentNumber: z.string().min(5, "Document number is required"),
  expiryDate: z.string().datetime().optional(),
  frontImage: z.string().url("Valid image URL required"),
  backImage: z.string().url("Valid image URL required").optional(),
});

/**
 * KYC submission validation
 */
export const kycSubmissionSchema = z.object({
  fullName: z.string().min(5, "Full name is required"),
  dateOfBirth: z.string().datetime(),
  nationality: z.string().length(2, "Country code must be 2 characters"),
  occupation: z.string().min(2, "Occupation is required"),
  sourceOfFunds: z.enum(["employment", "business", "investment", "inheritance", "other"]),
  documents: z.array(kycDocumentSchema).min(2, "At least 2 documents required"),
});

// ============================================================================
// MFA SCHEMAS
// ============================================================================

/**
 * MFA setup validation
 */
export const mfaSetupSchema = z.object({
  secret: z.string().min(16, "Invalid MFA secret"),
  token: z.string().length(6, "MFA code must be 6 digits").regex(/^\d{6}$/, "MFA code must be numeric"),
});

/**
 * MFA verification validation
 */
export const mfaVerifySchema = z.object({
  code: z.string().length(6, "MFA code must be 6 digits").regex(/^\d{6}$/, "MFA code must be numeric"),
});

/**
 * MFA backup code validation
 */
export const mfaBackupSchema = z.object({
  backupCode: z.string().length(12, "Invalid backup code format"),
});

// ============================================================================
// ADMIN & SUPPORT SCHEMAS
// ============================================================================

/**
 * Support ticket validation
 */
export const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject too long"),
  message: z.string().min(20, "Message must be at least 20 characters").max(5000, "Message too long"),
  category: z.enum(["account", "transaction", "kyc", "technical", "other"]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  attachments: z.array(z.string().url()).max(5, "Maximum 5 attachments allowed").optional(),
});

// ============================================================================
// UTILITY TYPES (Infer types from schemas)
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type BuyGoldInput = z.infer<typeof buyGoldSchema>;
export type SellGoldInput = z.infer<typeof sellGoldSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;

export type KYCDocumentInput = z.infer<typeof kycDocumentSchema>;
export type KYCSubmissionInput = z.infer<typeof kycSubmissionSchema>;

export type MFASetupInput = z.infer<typeof mfaSetupSchema>;
export type MFAVerifyInput = z.infer<typeof mfaVerifySchema>;
export type MFABackupInput = z.infer<typeof mfaBackupSchema>;

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
