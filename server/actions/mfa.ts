// /server/actions/mfa.ts
// Multi-Factor Authentication (MFA) server actions
// Handles 2FA setup, verification, backup codes, and management

"use server";

import { requireAuth } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import MFA from "@/server/models/MFA";
import {
  mfaSetupSchema,
  mfaVerifySchema,
  mfaBackupSchema,
} from "@/server/lib/validation";
import {
  generateToken,
  generateBackupCodes,
  hashPassword,
  verifyPassword,
} from "@/server/lib/crypto";
import { sendEmail } from "@/server/email/send";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

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
// SETUP MFA ACTION (Generate Secret & QR Code)
// ============================================================================

/**
 * Generate MFA secret and QR code for user setup
 * @returns ActionResponse with secret and QR code
 *
 * Process:
 * 1. Check if MFA is already enabled
 * 2. Generate TOTP secret
 * 3. Generate QR code for authenticator app
 * 4. Return secret and QR code (NOT saved yet - waiting for verification)
 */
export async function setupMFAAction(): Promise<
  ActionResponse<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }>
> {
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

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return {
        success: false,
        error: "MFA is already enabled for your account",
      };
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Galla Gold (${user.email})`,
      issuer: "Galla Gold",
      length: 32,
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes (8 codes)
    const backupCodes = generateBackupCodes(8);

    // Store temporary secret in session or cache
    // For now, we'll return it and verify in next step
    // In production, consider using Redis or similar for temp storage

    return {
      success: true,
      message:
        "MFA setup initiated. Please scan the QR code with your authenticator app.",
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        backupCodes,
      },
    };
  } catch (error: any) {
    console.error("Setup MFA error:", error);

    return {
      success: false,
      error: error.message || "Failed to setup MFA",
    };
  }
}

// ============================================================================
// VERIFY MFA SETUP ACTION
// ============================================================================

/**
 * Verify MFA setup by confirming a TOTP code
 * @param formData - Form data with secret and verification code
 * @returns ActionResponse with confirmation
 *
 * Process:
 * 1. Validate code against secret
 * 2. Save MFA configuration to database
 * 3. Enable MFA for user
 * 4. Hash and save backup codes
 */
export async function verifyMFASetupAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const rawData = {
      secret: formData.get("secret") as string,
      token: formData.get("token") as string,
    };

    const validated = mfaSetupSchema.parse(rawData);

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: validated.secret,
      encoding: "base32",
      token: validated.token,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });

    if (!isValid) {
      return {
        success: false,
        error: "Invalid verification code. Please try again.",
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

    // Get backup codes from form data
    const backupCodesRaw = formData.get("backupCodes") as string;
    const backupCodes = JSON.parse(backupCodesRaw);

    // Hash backup codes before storing
    const backupCodesWithStructure = await Promise.all(
      backupCodes.map(async (code: string) => ({
        code: await hashPassword(code),
        used: false,
        usedAt: undefined,
        usedIp: undefined,
      }))
    );

    const mfa = await MFA.create({
      userId: session.user.id,
      secret: validated.secret,
      backupCodes: backupCodesWithStructure,
      enabled: true,
      verifiedAt: new Date(),
    });

    // Enable MFA for user
    user.mfaEnabled = true;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Two-Factor Authentication Enabled - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Security Update",
        amount: "2FA enabled",
        date: new Date().toLocaleDateString(),
        transactionId: mfa._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: "Two-factor authentication has been enabled successfully!",
    };
  } catch (error: any) {
    console.error("Verify MFA setup error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to verify MFA setup",
    };
  }
}

// ============================================================================
// VERIFY MFA CODE ACTION (During Login)
// ============================================================================

/**
 * Verify MFA code during login or sensitive operation
 * @param formData - Form data with verification code
 * @returns ActionResponse with verification result
 *
 * Used after initial password authentication
 */
export async function verifyMFACodeAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    // Extract and validate code
    const rawData = {
      code: formData.get("code") as string,
    };

    const validated = mfaVerifySchema.parse(rawData);

    await connectDB();

    const mfa = await MFA.findOne({
      userId: session.user.id,
      enabled: true,
    });

    if (!mfa) {
      return {
        success: false,
        error: "MFA not enabled for this account",
      };
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: mfa.secret,
      encoding: "base32",
      token: validated.code,
      window: 2,
    });

    if (!isValid) {
      // Increment failed attempts
      mfa.failedAttempts += 1;
      mfa.failedAttempts += 1;

      // Lock MFA after 5 failed attempts
      if (mfa.failedAttempts >= 5) {
        mfa.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await mfa.save();

        return {
          success: false,
          error: "Too many failed attempts. MFA locked for 15 minutes.",
        };
      }

      await mfa.save();

      return {
        success: false,
        error: `Invalid verification code. ${
          5 - mfa.failedAttempts
        } attempts remaining.`,
      };
    }

    // Successful verification - reset failed attempts
    mfa.failedAttempts = 0;
    mfa.failedAttempts = 0;
    await mfa.save();

    return {
      success: true,
      message: "Verification successful",
    };
  } catch (error: any) {
    console.error("Verify MFA code error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to verify MFA code",
    };
  }
}

// ============================================================================
// USE BACKUP CODE ACTION
// ============================================================================

/**
 * Use backup code for MFA verification
 * @param formData - Form data with backup code
 * @returns ActionResponse with verification result
 *
 * Backup codes are single-use and removed after successful use
 */
export async function useBackupCodeAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    // Extract and validate backup code
    const rawData = {
      backupCode: formData.get("backupCode") as string,
    };

    const validated = mfaBackupSchema.parse(rawData);

    await connectDB();

    const mfa = await MFA.findOne({
      userId: session.user.id,
      enabled: true,
    });

    if (!mfa) {
      return {
        success: false,
        error: "MFA not enabled for this account",
      };
    }

    // Check each stored backup code
    let codeFound = false;
    let codeIndex = -1;

    for (let i = 0; i < mfa.backupCodes.length; i++) {
      const isMatch = await verifyPassword(
        validated.backupCode,
        mfa.backupCodes[i].code
      );

      if (isMatch) {
        codeFound = true;
        codeIndex = i;
        break;
      }
    }

    if (!codeFound) {
      return {
        success: false,
        error: "Invalid backup code",
      };
    }

    // Remove used backup code
    mfa.backupCodes.splice(codeIndex, 1);
    await mfa.save();

    // Warn if running low on backup codes
    const remainingCodes = mfa.backupCodes.length;
    let warningMessage = "";

    if (remainingCodes === 0) {
      warningMessage =
        " WARNING: You have no backup codes remaining. Please generate new ones.";
    } else if (remainingCodes <= 2) {
      warningMessage = ` WARNING: You only have ${remainingCodes} backup codes remaining.`;
    }

    return {
      success: true,
      message: `Verification successful using backup code.${warningMessage}`,
    };
  } catch (error: any) {
    console.error("Use backup code error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to verify backup code",
    };
  }
}

// ============================================================================
// REGENERATE BACKUP CODES ACTION
// ============================================================================

/**
 * Generate new backup codes (requires MFA verification)
 * @param formData - Form data with current MFA code
 * @returns ActionResponse with new backup codes
 *
 * Requires verification of current MFA code before generating new codes
 */
export async function regenerateBackupCodesAction(
  formData: FormData
): Promise<ActionResponse<{ backupCodes: string[] }>> {
  try {
    const session = await requireAuth();

    // Verify current MFA code first
    const verifyResult = await verifyMFACodeAction(formData);

    if (!verifyResult.success) {
      return {
        success: false,
        error: "MFA verification required to regenerate backup codes",
      };
    }

    await connectDB();

    const mfa = await MFA.findOne({
      userId: session.user.id,
      enabled: true,
    });

    if (!mfa) {
      return {
        success: false,
        error: "MFA not enabled for this account",
      };
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(8);

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      newBackupCodes.map((code) => hashPassword(code))
    );

    // Replace old backup codes with new ones
    mfa.backupCodes = hashedBackupCodes.map((code) => ({ code, used: false }));
    await mfa.save();

    const user = await User.findById(session.user.id);

    // Send notification email
    if (user) {
      await sendEmail({
        to: user.email,
        subject: "Backup Codes Regenerated - Galla Gold",
        template: "transaction",
        data: {
          firstName: user.firstName,
          type: "Security Update",
          amount: "Backup codes regenerated",
          date: new Date().toLocaleDateString(),
          transactionId: mfa._id.toString(),
          status: "completed",
        },
      });
    }

    return {
      success: true,
      message:
        "New backup codes generated successfully. Please save them in a secure location.",
      data: {
        backupCodes: newBackupCodes,
      },
    };
  } catch (error: any) {
    console.error("Regenerate backup codes error:", error);

    return {
      success: false,
      error: error.message || "Failed to regenerate backup codes",
    };
  }
}

// ============================================================================
// DISABLE MFA ACTION
// ============================================================================

/**
 * Disable MFA for user account (requires password confirmation)
 * @param formData - Form data with password
 * @returns ActionResponse with confirmation
 *
 * Requires password confirmation for security
 */
export async function disableMFAAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await requireAuth();

    const password = formData.get("password") as string;

    if (!password) {
      return {
        success: false,
        error: "Password is required to disable MFA",
      };
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("+password");

    if (!user) {
      return {
        success: false,
        error: "User not found",
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

    // Find and disable MFA
    const mfa = await MFA.findOne({
      userId: session.user.id,
    });

    if (!mfa) {
      return {
        success: false,
        error: "MFA not found",
      };
    }

    // Disable MFA
    mfa.enabled = false;
    await mfa.save();

    // Update user
    user.mfaEnabled = false;
    await user.save();

    // Send notification email
    await sendEmail({
      to: user.email,
      subject: "Two-Factor Authentication Disabled - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "Security Update",
        amount: "2FA disabled",
        date: new Date().toLocaleDateString(),
        transactionId: mfa._id.toString(),
        status: "completed",
      },
    });

    return {
      success: true,
      message: "Two-factor authentication has been disabled",
    };
  } catch (error: any) {
    console.error("Disable MFA error:", error);

    return {
      success: false,
      error: error.message || "Failed to disable MFA",
    };
  }
}

// ============================================================================
// GET MFA STATUS ACTION
// ============================================================================

/**
 * Get MFA status for current user
 * @returns ActionResponse with MFA status details
 */
export async function getMFAStatusAction(): Promise<
  ActionResponse<{
    enabled: boolean;
    verifiedAt?: Date;
    remainingBackupCodes?: number;
  }>
> {
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

    if (!user.mfaEnabled) {
      return {
        success: true,
        data: {
          enabled: false,
        },
      };
    }

    const mfa = await MFA.findOne({
      userId: session.user.id,
      enabled: true,
    });

    if (!mfa) {
      return {
        success: true,
        data: {
          enabled: false,
        },
      };
    }

    return {
      success: true,
      data: {
        enabled: true,
        verifiedAt: mfa.verifiedAt,
        remainingBackupCodes: mfa.backupCodes.length,
      },
    };
  } catch (error: any) {
    console.error("Get MFA status error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch MFA status",
    };
  }
}
