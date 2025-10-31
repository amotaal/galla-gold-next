// app/signup/page.tsx
// Signup Page for GALLA.GOLD - FIXED
// Purpose: User registration with email/password credentials
// ✅ FIX: Extracted password toggle buttons to separate component

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth";
import { signupAction } from "@/server/actions/auth";
import { PasswordToggleButton } from "@/components/password-toggle";
import {
  Mail,
  Lock,
  User,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

/**
 * SignupPage - User registration page
 *
 * Features:
 * - First name, last name, email, password fields
 * - Password confirmation
 * - Password visibility toggle
 * - Terms acceptance checkbox
 * - Form validation
 * - Loading states
 * - Error handling
 * - Success message with verification prompt
 * - Auto-redirect if already authenticated
 */
export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mark as mounted for animations
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Accept Terms",
        description: "Please accept the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);

      // Call signup action
      const result = await signupAction(formData);

      if (!result.success) {
        toast({
          title: "Signup Failed",
          description: result.error || "Unable to create account.",
          variant: "destructive",
        });
        return;
      }

      // Success!
      setShowSuccess(true);
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't show signup page if already authenticated
  if (isAuthenticated) {
    return null;
  }

  // Show success message
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-md border-border shadow-2xl">
          <div className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/10">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Account Created!</h2>
            <p className="text-muted-foreground mb-2">
              We've sent a verification email to:
            </p>
            <p className="font-medium text-primary mb-6">{email}</p>
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to activate
              your account.
            </p>

            <div className="mt-8">
              <Link href="/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Signup Card */}
      <Card
        className={`w-full max-w-md relative bg-card/80 backdrop-blur-md border-border shadow-2xl transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="GALLA.GOLD"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
            <p className="text-muted-foreground text-sm">
              Start investing in gold today
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10"
                    autoComplete="given-name"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                  required
                />
                <PasswordToggleButton
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                  required
                />
                <PasswordToggleButton
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link href="/login">
              <Button variant="outline" className="w-full" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
}
