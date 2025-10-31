// app/login/page.tsx
// Login Page for GALLA.GOLD
// Purpose: User authentication with email/password credentials

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

/**
 * LoginPage - Authentication page with email/password login
 *
 * Features:
 * - Email and password input fields
 * - Password visibility toggle
 * - Form validation
 * - Loading states
 * - Error handling
 * - Links to signup and password reset
 * - Auto-redirect to dashboard when authenticated
 * - Callback URL support
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get callback URL from query params
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Mark as mounted for animations
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, isAuthLoading, router, callbackUrl]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
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

    setIsLoading(true);

    try {
      // Sign in with Auth.js
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Handle redirect manually
      });

      if (result?.error) {
        // Authentication failed
        toast({
          title: "Login Failed",
          description: result.error || "Invalid email or password.",
          variant: "destructive",
        });
      } else if (result?.ok) {
        // Authentication successful
        toast({
          title: "Welcome Back!",
          description: "Redirecting to your dashboard...",
        });

        // Redirect after short delay
        setTimeout(() => {
          router.push(callbackUrl);
        }, 500);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthLoading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div
          className={`w-full max-w-md space-y-8 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <Image
                  src="/gold-bars.gif"
                  alt="GALLA.GOLD"
                  width={64}
                  height={64}
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gold-gradient">
                GALLA.GOLD
              </h1>
              <p className="text-xl font-semibold text-foreground mt-2">
                Welcome Back
              </p>
              <p className="text-muted-foreground mt-1">
                Sign in to your account to continue
              </p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="glass-card p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/reset"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold-glow"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Magic Link Option */}
            <Link href="/magic">
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
                size="lg"
              >
                Sign in with Magic Link
              </Button>
            </Link>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </div>
          </Card>

          {/* Security Notice */}
          <p className="text-center text-xs text-muted-foreground">
            Protected by bank-level encryption and two-factor authentication
          </p>
        </div>
      </main>
    </div>
  );
}
