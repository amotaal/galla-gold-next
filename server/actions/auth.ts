// /server/actions/auth.ts
// Authentication server actions
// Handles login, signup, email verification, password reset, and magic link

"use server";

import { signIn, signOut } from "@/server/auth/config";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import Wallet from "@/server/models/Wallet";
import {
  loginSchema,
  signupSchema,
  verifyEmailSchema,
  resetRequestSchema,
  resetPasswordSchema,
  magicLinkSchema,
} from "@/server/lib/validation";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  createExpiringToken,
  isTokenExpired,
} from "@/server/lib/crypto";
import { sendEmail } from "@/server/email/send";
import { AuthError } from "next-auth";

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
// LOGIN ACTION
// ============================================================================

/**
 * Login with email and password
 * @param formData - Login form data {email, password, rememberMe}
 * @returns ActionResponse - Success or error message
 * 
 * Process:
 * 1. Validate input
 * 2. Attempt sign in with Auth.js
 * 3. Return success or error
 */
export async function loginAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Extract and validate form data
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "true",
    };

    // Validate with Zod
    const validated = loginSchema.parse(rawData);

    // Attempt sign in with Auth.js
    const result = await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });

    // Check if sign in was successful
    if (!result || result.error) {
      return {
        success: false,
        error: result?.error || "Invalid credentials",
      };
    }

    return {
      success: true,
      message: "Login successful",
    };
  } catch (error: any) {
    // Handle Auth.js errors
    if (error instanceof AuthError) {
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }

    // Handle validation errors
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    // Generic error
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// ============================================================================
// SIGNUP ACTION
// ============================================================================

/**
 * Register new user account
 * @param formData - Signup form data
 * @returns ActionResponse - Success message or error
 * 
 * Process:
 * 1. Validate input
 * 2. Check if user already exists
 * 3. Hash password
 * 4. Create user and wallet
 * 5. Send verification email
 */
export async function signupAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Extract form data
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone") || undefined,
      acceptTerms: formData.get("acceptTerms") === "true",
    };

    // Validate with Zod
    const validated = signupSchema.parse(rawData);

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);

    // Generate email verification token (expires in 24 hours)
    const { token, expiresAt } = createExpiringToken(60 * 24); // 24 hours

    // Create user
    const user = await User.create({
      email: validated.email,
      password: hashedPassword,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone,
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
      isActive: true,
      role: "user",
      loginAttempts: 0,
      kycStatus: "none",
      mfaEnabled: false,
    });

    // Create wallet for user (with zero balances)
    await Wallet.create({
      userId: user._id,
      balance: {
        USD: 0,
        EUR: 0,
        GBP: 0,
        EGP: 0,
        SAR: 0,
      },
      gold: {
        grams: 0,
        averagePurchasePrice: 0,
      },
      dailyLimits: {
        deposit: 10000, // $10,000 USD
        withdrawal: 10000,
        goldPurchase: 10000,
        goldSale: 10000,
      },
      lifetimeLimits: {
        deposit: 100000, // $100,000 USD
        withdrawal: 100000,
        goldPurchase: 100000,
        goldSale: 100000,
      },
      usedToday: {
        deposit: 0,
        withdrawal: 0,
        goldPurchase: 0,
        goldSale: 0,
      },
      lastReset: new Date(),
    });

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: "Verify your email - Galla Gold",
      template: "verify",
      data: {
        firstName: user.firstName,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`,
      },
    });

    return {
      success: true,
      message: "Account created! Please check your email to verify your account.",
    };
  } catch (error: any) {
    console.error("Signup error:", error);

    // Handle validation errors
    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    // Handle duplicate email (MongoDB error)
    if (error.code === 11000) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}

// ============================================================================
// EMAIL VERIFICATION ACTION
// ============================================================================

/**
 * Verify user email with token
 * @param formData - Form data with verification token
 * @returns ActionResponse - Success or error message
 * 
 * Process:
 * 1. Validate token
 * 2. Find user with matching token
 * 3. Check if token is expired
 * 4. Mark email as verified
 */
export async function verifyEmailAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Extract and validate token
    const rawData = {
      token: formData.get("token"),
    };

    const validated = verifyEmailSchema.parse(rawData);

    // Connect to database
    await connectDB();

    // Find user with matching token
    const user = await User.findOne({
      emailVerificationToken: validated.token,
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid or expired verification link",
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: "Email already verified! You can now log in.",
      };
    }

    // Check if token is expired
    if (
      user.emailVerificationExpires &&
      isTokenExpired(user.emailVerificationExpires)
    ) {
      return {
        success: false,
        error: "Verification link has expired. Please request a new one.",
      };
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: "Welcome to Galla Gold!",
      template: "welcome",
      data: {
        firstName: user.firstName,
      },
    });

    return {
      success: true,
      message: "Email verified successfully! You can now log in.",
    };
  } catch (error: any) {
    console.error("Verification error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Invalid verification link",
      };
    }

    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}

// ============================================================================
// PASSWORD RESET REQUEST ACTION
// ============================================================================

/**
 * Request password reset link
 * @param formData - Form data with email
 * @returns ActionResponse - Success message (always, for security)
 * 
 * Process:
 * 1. Validate email
 * 2. Find user (if exists)
 * 3. Generate reset token
 * 4. Send reset email
 * 
 * Note: Always returns success to prevent email enumeration attacks
 */
export async function resetPasswordRequestAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Extract and validate email
    const rawData = {
      email: formData.get("email"),
    };

    const validated = resetRequestSchema.parse(rawData);

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findOne({ email: validated.email });

    // If user exists, generate reset token and send email
    if (user) {
      // Generate reset token (expires in 1 hour)
      const { token, expiresAt } = createExpiringToken(60); // 1 hour

      // Save token to user
      user.passwordResetToken = token;
      user.passwordResetExpires = expiresAt;
      await user.save();

      // Send reset email
      await sendEmail({
        to: user.email,
        subject: "Reset your password - Galla Gold",
        template: "reset",
        data: {
          firstName: user.firstName,
          resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset?token=${token}`,
        },
      });
    }

    // Always return success (security best practice)
    return {
      success: true,
      message: "If an account exists with this email, you will receive password reset instructions.",
    };
  } catch (error: any) {
    console.error("Reset request error:", error);

    // Still return success to prevent email enumeration
    return {
      success: true,
      message: "If an account exists with this email, you will receive password reset instructions.",
    };
  }
}

// ============================================================================
// PASSWORD RESET ACTION
// ============================================================================

/**
 * Reset password with token
 * @param formData - Form data with token and new password
 * @returns ActionResponse - Success or error message
 * 
 * Process:
 * 1. Validate input
 * 2. Find user with matching token
 * 3. Check if token is expired
 * 4. Hash new password
 * 5. Update password and clear token
 */
export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Extract and validate data
    const rawData = {
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validated = resetPasswordSchema.parse(rawData);

    // Connect to database
    await connectDB();

    // Find user with matching token
    const user = await User.findOne({
      passwordResetToken: validated.token,
    }).select("+password");

    if (!user) {
      return {
        success: false,
        error: "Invalid or expired reset link",
      };
    }

    // Check if token is expired
    if (
      user.passwordResetExpires &&
      isTokenExpired(user.passwordResetExpires)
    ) {
      return {
        success: false,
        error: "Reset link has expired. Please request a new one.",
      };
    }

    // Check if new password is same as old password
    const isSamePassword = await verifyPassword(
      validated.password,
      user.password
    );
    if (isSamePassword) {
      return {
        success: false,
        error: "New password must be different from your current password",
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(validated.password);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0; // Reset login attempts
    user.lockUntil = undefined; // Unlock account if locked
    await user.save();

    return {
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    };
  } catch (error: any) {
    console.error("Reset password error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}

// ============================================================================
// MAGIC LINK ACTION
// ============================================================================

/**
 * Request magic link for passwordless login
 * @param formData - Form data with email
 * @returns ActionResponse - Success message
 * 
 * Process:
 * 1. Validate email
 * 2. Find user
 * 3. Generate magic link token
 * 4. Send magic link email
 */
export async function magicLinkAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Extract and validate email
    const rawData = {
      email: formData.get("email"),
    };

    const validated = magicLinkSchema.parse(rawData);

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findOne({ email: validated.email });

    if (!user) {
      // Don't reveal that user doesn't exist
      return {
        success: true,
        message: "If an account exists with this email, you will receive a magic link.",
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        error: "Please verify your email before using magic link login",
      };
    }

    // Generate magic link token (expires in 15 minutes)
    const { token, expiresAt } = createExpiringToken(15);

    // Save token
    user.magicLinkToken = token;
    user.magicLinkExpires = expiresAt;
    await user.save();

    // Send magic link email
    await sendEmail({
      to: user.email,
      subject: "Your magic link - Galla Gold",
      template: "magic",
      data: {
        firstName: user.firstName,
        magicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/magic?token=${token}`,
      },
    });

    return {
      success: true,
      message: "Magic link sent! Check your email and click the link to log in.",
    };
  } catch (error: any) {
    console.error("Magic link error:", error);

    // Always return success for security
    return {
      success: true,
      message: "If an account exists with this email, you will receive a magic link.",
    };
  }
}

// ============================================================================
// LOGOUT ACTION
// ============================================================================

/**
 * Sign out current user
 * @returns ActionResponse - Success message
 */
export async function logoutAction(): Promise<ActionResponse> {
  try {
    await signOut({ redirect: false });

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    console.error("Logout error:", error);

    return {
      success: false,
      error: "Failed to log out. Please try again.",
    };
  }
}

// ============================================================================
// RESEND VERIFICATION EMAIL ACTION
// ============================================================================

/**
 * Resend verification email
 * @param formData - Form data with email
 * @returns ActionResponse - Success message
 */
export async function resendVerificationAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const email = formData.get("email") as string;

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist
      return {
        success: true,
        message: "If an account exists with this email, verification email has been sent.",
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: "Email is already verified",
      };
    }

    // Generate new verification token
    const { token, expiresAt } = createExpiringToken(60 * 24); // 24 hours

    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: "Verify your email - Galla Gold",
      template: "verify",
      data: {
        firstName: user.firstName,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`,
      },
    });

    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    };
  } catch (error: any) {
    console.error("Resend verification error:", error);

    return {
      success: false,
      error: "Failed to send verification email. Please try again.",
    };
  }
}
