// server/actions/auth.ts
// Authentication server actions - FIXED
// Handles login, signup, email verification, password reset, and magic link
// ✅ FIXED: Proper error handling that doesn't access .errors on non-Zod errors

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
import { ZodError } from "zod";

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

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "true",
    };

    const validated = loginSchema.parse(rawData);

    const result = await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });

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
    console.error("Login error:", error);

    if (error instanceof AuthError) {
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// ============================================================================
// SIGNUP ACTION
// ============================================================================

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
    const existingUser = await User.findOne({
      email: validated.email.toLowerCase(),
    });
    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Generate email verification token (expires in 24 hours)
    const { token, expiresAt } = createExpiringToken(60 * 24); // 24 hours

    // Create new user (password will be auto-hashed by pre-save hook)
    const user = await User.create({
      email: validated.email.toLowerCase(),
      password: validated.password, // Will be auto-hashed
      firstName: validated.firstName,
      lastName: validated.lastName,
      fullName: `${validated.firstName} ${validated.lastName}`,
      phone: validated.phone,
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
    });

    // Create wallet for user
    await Wallet.create({
      userId: user._id,
      balance: {
        USD: 0,
        EUR: 0,
        GBP: 0,
        EGP: 0,
        AED: 0,
        SAR: 0,
      },
    });

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - GALLA.GOLD",
      template: "verify",
      data: {
        firstName: user.firstName,
        verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`,
      },
    });

    return {
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
    };
  } catch (error: any) {
    console.error("Signup error:", error);

    // ✅ FIXED: Proper error type checking
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

// ============================================================================
// LOGOUT ACTION
// ============================================================================

export async function logoutAction(): Promise<ActionResponse> {
  try {
    await signOut({ redirectTo: "/" });
    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to logout. Please try again.",
    };
  }
}

// ============================================================================
// EMAIL VERIFICATION ACTION
// ============================================================================

export async function verifyEmailAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      token: formData.get("token"),
    };

    const validated = verifyEmailSchema.parse(rawData);

    await connectDB();

    const user = await User.findOne({
      emailVerificationToken: validated.token,
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid or expired verification link",
      };
    }

    if (
      user.emailVerificationExpires &&
      isTokenExpired(user.emailVerificationExpires)
    ) {
      return {
        success: false,
        error: "Verification link has expired. Please request a new one.",
      };
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
      success: true,
      message: "Email verified successfully! You can now log in.",
    };
  } catch (error: any) {
    console.error("Email verification error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: "Failed to verify email. Please try again.",
    };
  }
}

// ============================================================================
// PASSWORD RESET REQUEST ACTION
// ============================================================================

export async function resetRequestAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      email: formData.get("email"),
    };

    const validated = resetRequestSchema.parse(rawData);

    await connectDB();

    const user = await User.findOne({ email: validated.email.toLowerCase() });

    if (!user) {
      return {
        success: true,
        message: "If an account exists, a reset link has been sent.",
      };
    }

    const { token, expiresAt } = createExpiringToken(60); // 1 hour

    user.passwordResetToken = token;
    user.passwordResetExpires = expiresAt;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset - GALLA.GOLD",
      template: "reset",
      data: {
        firstName: user.firstName,
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`,
      },
    });

    return {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    };
  } catch (error: any) {
    console.error("Reset request error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: "Failed to process request. Please try again.",
    };
  }
}

// ============================================================================
// PASSWORD RESET ACTION
// ============================================================================

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validated = resetPasswordSchema.parse(rawData);

    await connectDB();

    const user = await User.findOne({
      passwordResetToken: validated.token,
    }).select("+password");

    if (!user) {
      return {
        success: false,
        error: "Invalid or expired reset link",
      };
    }

    if (
      user.passwordResetExpires &&
      isTokenExpired(user.passwordResetExpires)
    ) {
      return {
        success: false,
        error: "Reset link has expired. Please request a new one.",
      };
    }

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

    user.password = validated.password; // Will be auto-hashed
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return {
      success: true,
      message:
        "Password reset successfully! You can now log in with your new password.",
    };
  } catch (error: any) {
    console.error("Reset password error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
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

export async function magicLinkAction(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const rawData = {
      email: formData.get("email"),
    };

    const validated = magicLinkSchema.parse(rawData);

    await connectDB();

    const user = await User.findOne({ email: validated.email.toLowerCase() });

    if (!user) {
      return {
        success: true,
        message: "If an account exists, a magic link has been sent.",
      };
    }

    const { token, expiresAt } = createExpiringToken(15);

    user.magicLinkToken = token;
    user.magicLinkExpires = expiresAt;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Your Magic Link - GALLA.GOLD",
      template: "magic",
      data: {
        firstName: user.firstName,
        magicLink: `${process.env.NEXT_PUBLIC_APP_URL}/magic-login?token=${token}`,
      },
    });

    return {
      success: true,
      message: "If an account exists, a magic link has been sent.",
    };
  } catch (error: any) {
    console.error("Magic link error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: "Failed to send magic link. Please try again.",
    };
  }
}
