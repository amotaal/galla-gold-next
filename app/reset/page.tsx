// /app/reset/page.tsx
// Password Reset Page - Public route for resetting forgotten passwords
// Purpose: Allow users to reset their password using a token sent via email

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { resetPasswordAction } from "@/server/actions/auth";
import { toast } from "sonner";

/**
 * Password Reset Page Component
 *
 * Two modes:
 * 1. Request Reset - User enters email, receives token
 * 2. Reset Password - User enters new password with token from email
 */
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token from URL query params
  const tokenFromUrl = searchParams.get("token");

  // UI state
  const [mode, setMode] = useState<"request" | "reset">(
    tokenFromUrl ? "reset" : "request"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form data
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenFromUrl || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);

  // Update token if URL changes
  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setMode("reset");
    }
  }, [tokenFromUrl]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength("weak");
    else if (strength <= 3) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  }, [password]);

  // Handle request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email required", {
        description: "Please enter your email address",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("email", email);

      const result = await resetPasswordAction(formData);

      if (result.success) {
        setSuccessMessage(
          "Password reset link sent! Check your email for instructions."
        );
        toast.success("Email sent!", {
          description: "Check your inbox for the reset link",
        });
      } else {
        toast.error("Request failed", {
          description: result.error || "Unable to send reset email",
        });
      }
    } catch (error) {
      console.error("Request reset error:", error);
      toast.error("Request failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset password with token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!token) {
      toast.error("Invalid link", {
        description: "This password reset link is invalid or expired",
      });
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Password required", {
        description: "Please enter and confirm your new password",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are identical",
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);

      const result = await resetPasswordAction(formData);

      if (result.success) {
        toast.success("Password reset successful!", {
          description: "You can now log in with your new password",
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error("Reset failed", {
          description: result.error || "Unable to reset password",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Reset failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <Card className="relative w-full max-w-md bg-card/80 backdrop-blur-xl border-border p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            {mode === "request" ? (
              <Lock className="w-8 h-8 text-primary" />
            ) : (
              <Shield className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {mode === "request" ? "Reset Password" : "Set New Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "request"
              ? "Enter your email to receive a password reset link"
              : "Choose a strong password for your account"}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-500">Email Sent!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Request Reset Form */}
        {mode === "request" && !successMessage && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 pr-10"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    <div
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength === "weak"
                          ? "bg-red-500"
                          : passwordStrength === "medium"
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength === "medium"
                          ? "bg-amber-500"
                          : passwordStrength === "strong"
                          ? "bg-green-500"
                          : "bg-secondary"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength === "strong"
                          ? "bg-green-500"
                          : "bg-secondary"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs ${
                      passwordStrength === "weak"
                        ? "text-red-500"
                        : passwordStrength === "medium"
                        ? "text-amber-500"
                        : "text-green-500"
                    }`}
                  >
                    Password strength: {passwordStrength}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 pr-10"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2">
                  {password === confirmPassword ? (
                    <div className="flex items-center gap-2 text-xs text-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      Passwords don't match
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs font-semibold text-blue-500 mb-2">
                Password Requirements:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  {password.length >= 8 ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  )}
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  {/[a-z]/.test(password) && /[A-Z]/.test(password) ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  )}
                  Mix of uppercase and lowercase
                </li>
                <li className="flex items-center gap-2">
                  {/\d/.test(password) ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  )}
                  At least one number
                </li>
                <li className="flex items-center gap-2">
                  {/[^a-zA-Z0-9]/.test(password) ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  )}
                  At least one special character
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={
                isSubmitting ||
                !password ||
                !confirmPassword ||
                password !== confirmPassword ||
                password.length < 8
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <Link href="/login">
            <Button variant="ghost" className="w-full" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>

          {mode === "request" && !successMessage && (
            <p className="text-xs text-center text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}

          {mode === "reset" && (
            <p className="text-xs text-center text-muted-foreground">
              Don't have a reset link?{" "}
              <button
                onClick={() => setMode("request")}
                className="text-primary hover:underline"
              >
                Request new link
              </button>
            </p>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              For your security, password reset links expire after 24 hours. If
              your link has expired, request a new one.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Main page component with Suspense boundary
 * Required because we use useSearchParams()
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
