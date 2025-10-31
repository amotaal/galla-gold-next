// /server/actions/profile.ts
// Profile management server actions
// Handles user profile updates, password changes, preferences, and account deletion

"use server";

import { requireAuth } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import Wallet from "@/server/models/Wallet";
import Transaction from "@/server/models/Transaction";
import KYC from "@/server/models/KYC";
import MFA from "@/server/models/MFA";
import {
  profileUpdateSchema,
  changePasswordSchema,
} from "@/server/lib/validation";
import { hashPassword, verifyPassword } from "@/server/lib/crypto";
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
// GET PROFILE ACTION
// ============================================================================

/**
 * Get user's complete profile information
 * @returns ActionResponse with profile data
 */
export async function getProfileAction(): Promise<
  ActionResponse<{
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    preferredCurrency: string;
    preferredLanguage: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    kycStatus: string;
    createdAt: Date;
    lastLogin?: Date;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt,
      },
    };
  } catch (error: any) {
    console.error("Get profile error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch profile",
    };
  }
}

// ============================================================================
// UPDATE PROFILE ACTION
// ============================================================================

/**
 * Update user profile information
 * @param formData - Profile update form data
 * @returns ActionResponse with updated profile
 * 
 * Process:
 * 1. Validate input
 * 2. Update user record
 * 3. Return updated profile
 */
export async function updateProfileAction(
  formData: FormData
): Promise<ActionResponse<any>> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const address = formData.get("address")
      ? JSON.parse(formData.get("address") as string)
      : undefined;

    const rawData = {
      firstName: formData.get("firstName") || undefined,
      lastName: formData.get("lastName") || undefined,
      phone: formData.get("phone") || undefined,
      dateOfBirth: formData.get("dateOfBirth") || undefined,
      address,
      preferredCurrency: formData.get("preferredCurrency") || undefined,
      preferredLanguage: formData.get("preferredLanguage") || undefined,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(rawData).filter(([_, v]) => v !== undefined)
    );

    const validated = profileUpdateSchema.parse(cleanData);

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update user fields
    if (validated.firstName) user.firstName = validated.firstName;
    if (validated.lastName) user.lastName = validated.lastName;
    if (validated.phone) user.phone = validated.phone;
    if (validated.dateOfBirth) user.dateOfBirth = new Date(validated.dateOfBirth);
    if (validated.address) user.address = validated.address;
    if (validated.preferredCurrency) user.preferredCurrency = validated.preferredCurrency;
    if (validated.preferredLanguage) user.preferredLanguage = validated.preferredLanguage;

    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Profile Updated - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Profile Update",
        amount: "Information updated",
        date: new Date().toLocaleDateString(),
        transactionId: user._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: "Profile updated successfully",
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
      },
    };
  } catch (error: any) {
    console.error("Update profile error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}

// ============================================================================
// CHANGE PASSWORD ACTION
// ============================================================================

/**
 * Change user password
 * @param formData - Password change form data
 * @returns ActionResponse with confirmation
 * 
 * Process:
 * 1. Verify current password
 * 2. Validate new password
 * 3. Hash new password
 * 4. Update user record
 * 5. Send confirmation email
 */
export async function changePasswordAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const rawData = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validated = changePasswordSchema.parse(rawData);

    await connectDB();

    const user = await User.findById(session.user.id).select("+password");

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      validated.currentPassword,
      user.password
    );

    if (!isValidPassword) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(validated.newPassword);

    // Update password
    user.password = hashedPassword;
    user.loginAttempts = 0; // Reset login attempts
    user.lockUntil = undefined; // Unlock account if locked
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Password Changed - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Security Update",
        amount: "Password changed",
        date: new Date().toLocaleDateString(),
        transactionId: user._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error: any) {
    console.error("Change password error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to change password",
    };
  }
}

// ============================================================================
// UPDATE PREFERENCES ACTION
// ============================================================================

/**
 * Update user preferences (currency and language)
 * @param formData - Preferences form data
 * @returns ActionResponse with confirmation
 */
export async function updatePreferencesAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    const currency = formData.get("currency") as string;
    const language = formData.get("language") as string;

    if (!currency && !language) {
      return {
        success: false,
        error: "No preferences provided",
      };
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update preferences
    if (currency) user.preferredCurrency = currency;
    if (language) user.preferredLanguage = language;

    await user.save();

    return {
      success: true,
      message: "Preferences updated successfully",
    };
  } catch (error: any) {
    console.error("Update preferences error:", error);

    return {
      success: false,
      error: error.message || "Failed to update preferences",
    };
  }
}

// ============================================================================
// GET ACCOUNT SUMMARY ACTION
// ============================================================================

/**
 * Get account summary with statistics
 * @returns ActionResponse with account summary
 */
export async function getAccountSummaryAction(): Promise<
  ActionResponse<{
    profile: {
      email: string;
      name: string;
      memberSince: Date;
      kycStatus: string;
      mfaEnabled: boolean;
    };
    wallet: {
      totalValueUSD: number;
      goldGrams: number;
    };
    statistics: {
      totalTransactions: number;
      totalDeposits: number;
      totalWithdrawals: number;
      totalGoldPurchases: number;
    };
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const user = await User.findById(session.user.id).lean();
    const wallet = await Wallet.findOne({ userId: session.user.id }).lean();
    const transactions = await Transaction.find({
      userId: session.user.id,
      status: "completed",
    }).lean();

    if (!user || !wallet) {
      return {
        success: false,
        error: "Account data not found",
      };
    }

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalGoldPurchases: 0,
    };

    transactions.forEach((tx) => {
      if (tx.type === "deposit") stats.totalDeposits++;
      if (tx.type === "withdrawal") stats.totalWithdrawals++;
      if (tx.type === "gold_purchase") stats.totalGoldPurchases++;
    });

    // Calculate total wallet value in USD
    let totalValueUSD = wallet.balance.USD || 0;
    // Add gold value
    if (wallet.gold.grams > 0) {
      totalValueUSD += wallet.gold.grams * wallet.gold.averagePurchasePrice;
    }

    return {
      success: true,
      data: {
        profile: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          memberSince: user.createdAt,
          kycStatus: user.kycStatus,
          mfaEnabled: user.mfaEnabled,
        },
        wallet: {
          totalValueUSD: Math.round(totalValueUSD * 100) / 100,
          goldGrams: wallet.gold.grams,
        },
        statistics: stats,
      },
    };
  } catch (error: any) {
    console.error("Get account summary error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch account summary",
    };
  }
}

// ============================================================================
// REQUEST ACCOUNT DELETION ACTION
// ============================================================================

/**
 * Request account deletion (requires password confirmation)
 * @param formData - Form data with password
 * @returns ActionResponse with confirmation
 * 
 * Process:
 * 1. Verify password
 * 2. Check for active balances or pending transactions
 * 3. Mark account for deletion (soft delete)
 * 4. Send confirmation email
 * 
 * Note: Actual deletion happens after 30-day grace period
 */
export async function requestAccountDeletionAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    const password = formData.get("password") as string;
    const confirmText = formData.get("confirmText") as string;

    if (!password) {
      return {
        success: false,
        error: "Password is required",
      };
    }

    if (confirmText !== "DELETE") {
      return {
        success: false,
        error: 'Please type "DELETE" to confirm',
      };
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("+password");
    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!user || !wallet) {
      return {
        success: false,
        error: "User or wallet not found",
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Incorrect password",
      };
    }

    // Check for active balances
    const hasBalance =
      Object.values(wallet.balance).some((bal) => bal > 0) ||
      wallet.gold.grams > 0;

    if (hasBalance) {
      return {
        success: false,
        error: "Cannot delete account with active balances. Please withdraw all funds first.",
      };
    }

    // Check for pending transactions
    const pendingTransactions = await Transaction.countDocuments({
      userId: session.user.id,
      status: "pending",
    });

    if (pendingTransactions > 0) {
      return {
        success: false,
        error: "Cannot delete account with pending transactions. Please wait for them to complete.",
      };
    }

    // Mark account for deletion (soft delete)
    user.isActive = false;
    user.deletionRequestedAt = new Date();
    user.deletionScheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Account Deletion Requested - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Account Deletion",
        amount: "Scheduled for 30 days",
        date: new Date().toLocaleDateString(),
        transactionId: user._id.toString(),
        status: "pending",
      },
    });

    return {
      success: true,
      message: "Account deletion requested. Your account will be permanently deleted in 30 days. You can cancel this request by logging in again within this period.",
    };
  } catch (error: any) {
    console.error("Request account deletion error:", error);

    return {
      success: false,
      error: error.message || "Failed to request account deletion",
    };
  }
}

// ============================================================================
// CANCEL ACCOUNT DELETION ACTION
// ============================================================================

/**
 * Cancel account deletion request
 * @returns ActionResponse with confirmation
 */
export async function cancelAccountDeletionAction(): Promise<ActionResponse> {
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

    if (!user.deletionRequestedAt) {
      return {
        success: false,
        error: "No deletion request found",
      };
    }

    // Cancel deletion
    user.isActive = true;
    user.deletionRequestedAt = undefined;
    user.deletionScheduledFor = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Account Deletion Cancelled - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Account Restored",
        amount: "Deletion cancelled",
        date: new Date().toLocaleDateString(),
        transactionId: user._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: "Account deletion request cancelled successfully",
    };
  } catch (error: any) {
    console.error("Cancel account deletion error:", error);

    return {
      success: false,
      error: error.message || "Failed to cancel account deletion",
    };
  }
}

// ============================================================================
// EXPORT USER DATA ACTION (GDPR Compliance)
// ============================================================================

/**
 * Export all user data (GDPR compliance)
 * @returns ActionResponse with user data export
 */
export async function exportUserDataAction(): Promise<
  ActionResponse<{
    profile: any;
    wallet: any;
    transactions: any[];
    kyc: any;
    mfa: any;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const user = await User.findById(session.user.id).select("-password").lean();
    const wallet = await Wallet.findOne({ userId: session.user.id }).lean();
    const transactions = await Transaction.find({ userId: session.user.id }).lean();
    const kyc = await KYC.findOne({ userId: session.user.id }).lean();
    const mfa = await MFA.findOne({ userId: session.user.id }).select("-secret -backupCodes").lean();

    return {
      success: true,
      message: "User data exported successfully",
      data: {
        profile: user,
        wallet,
        transactions,
        kyc,
        mfa,
      },
    };
  } catch (error: any) {
    console.error("Export user data error:", error);

    return {
      success: false,
      error: error.message || "Failed to export user data",
    };
  }
}
