// /app/verify/page.tsx
// Email Verification Page for GALLA.GOLD
// Purpose: Handles email verification from link sent to user's email

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { verifyEmailAction } from "@/server/actions/auth";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

/**
 * VerifyEmailPage - Email verification page
 *
 * Features:
 * - Reads token from URL query params
 * - Verifies email with server action
 * - Shows success/error states
 * - Redirects to login on success
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("token", token);

        const result = await verifyEmailAction(formData);

        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Email verified successfully!");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(
            result.error || "Failed to verify email. Please try again."
          );
        }
      } catch (error) {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center space-y-6 border-border bg-card shadow-lg">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Verifying Email...</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </div>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to login...
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
              <p className="text-muted-foreground">{message}</p>
            </div>
            <div className="space-y-2">
              <Button onClick={() => router.push("/signup")} className="w-full">
                Create New Account
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </>
        )}

        {/* Back to Home Link */}
        <div className="pt-4 border-t border-border">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
