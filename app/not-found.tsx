// app/not-found.tsx
// 404 Not Found Page for GALLA.GOLD
// Purpose: Display a professional 404 error page with gold-themed styling

"use client";

import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * NotFound - 404 Error Page
 *
 * This page is automatically shown by Next.js when:
 * - A route doesn't exist
 * - notFound() is called in a page/layout
 *
 * Features:
 * - Gold-themed dark design
 * - Clear error message
 * - Links to return home or go back
 * - Glassmorphism effect
 * - Icon and animation
 */
export default function NotFound() {
  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="glass-card p-12 text-center space-y-8 rounded-2xl border-primary/20 interactive-glass">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Gold glow background */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse-slow" />

              {/* Icon */}
              <div className="relative bg-card border-2 border-primary rounded-full p-6 shadow-gold-glow">
                <AlertCircle className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="space-y-2">
            <h1 className="text-8xl font-extrabold text-gold-gradient animate-fade-in">
              404
            </h1>
            <p className="text-2xl font-bold text-foreground">Page Not Found</p>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground">
              The gold trail went cold.
            </p>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back on track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {/* Return Home */}
            <Link href="/">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold-glow hover:shadow-xl transition-all duration-300 group"
              >
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Return to Home
              </Button>
            </Link>

            {/* Go Back */}
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </div>

          {/* Help Text */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link
                href="/support"
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              >
                Contact support
              </Link>{" "}
              or visit our{" "}
              <Link
                href="/faq"
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              >
                FAQ page
              </Link>
            </p>
          </div>
        </div>

        {/* Popular Pages */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Popular pages you might be looking for:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * USAGE:
 *
 * This page is automatically used by Next.js for 404 errors.
 * You can also trigger it programmatically:
 *
 * import { notFound } from 'next/navigation';
 *
 * export default async function Page({ params }) {
 *   const data = await fetchData(params.id);
 *
 *   if (!data) {
 *     notFound(); // Triggers this 404 page
 *   }
 *
 *   return <div>{data.title}</div>;
 * }
 *
 *
 * CUSTOMIZATION:
 *
 * To create different 404 pages for specific sections:
 *
 * // app/dashboard/not-found.tsx
 * export default function DashboardNotFound() {
 *   return <div>Dashboard resource not found</div>;
 * }
 *
 * This will be used for all 404s within /dashboard/*
 */
