// /components/dialogs/buy.tsx
// Buy Gold Dialog - PROPER FULL-SCREEN VERSION
// Purpose: Professional, user-friendly dialog following fintech app standards
// FIX: Full-screen layout, proper spacing, clear sections, solid backgrounds

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/components/providers/wallet";
import {
  Plus,
  Coins,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  X,
  Shield,
  Truck,
  Zap,
  Clock,
} from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BuyGoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// BUY GOLD DIALOG COMPONENT
// ============================================================================

/**
 * BuyGoldDialog - Full-screen professional dialog
 *
 * Features:
 * - Full-screen layout (max-w-6xl)
 * - Solid opaque backgrounds
 * - Clear section organization
 * - Proper spacing and typography
 * - Professional fintech appearance
 * - Responsive design
 * - Accessibility compliant
 */
export function BuyGoldDialog({ open, onOpenChange }: BuyGoldDialogProps) {
  const { toast } = useToast();
  const { balance, goldPrice, refetchAll } = useWallet();

  // Form state
  const [grams, setGrams] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate costs
  const gramsNum = parseFloat(grams) || 0;
  const pricePerGram = goldPrice || 65.5;
  const subtotal = gramsNum * pricePerGram;
  const fee = subtotal * 0.01; // 1% fee
  const total = subtotal + fee;
  const availableBalance = balance?.USD || 0;

  /**
   * Handle purchase
   */
  const handleBuy = async () => {
    if (!gramsNum || gramsNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount of gold",
        variant: "destructive",
      });
      return;
    }

    if (gramsNum < 0.1) {
      toast({
        title: "Minimum Purchase",
        description: "Minimum purchase is 0.1 grams",
        variant: "destructive",
      });
      return;
    }

    if (total > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need $${total.toFixed(
          2
        )} but only have $${availableBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Purchase Successful!",
        description: `You bought ${gramsNum.toFixed(6)} grams of gold`,
      });

      await refetchAll();
      setGrams("");
      setShowConfirmation(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Buy gold error:", error);
      toast({
        title: "Purchase Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset and close dialog
   */
  const handleClose = () => {
    if (!isSubmitting) {
      setGrams("");
      setShowConfirmation(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-background border-border p-0 overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
          <DialogHeader className="flex-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 ring-1 ring-green-500/20">
                <Plus className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold">
                  Buy Gold
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Purchase physical gold at live market price
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Live Price Badge */}
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-base font-semibold"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Live: ${pricePerGram.toFixed(2)}/g
            </Badge>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-full hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6">
            {/* Two-column layout */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Form (2/3 width) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Available Balance Card */}
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-500 mb-2">
                        Available Balance
                      </h3>
                      <p className="text-4xl font-bold text-green-500">
                        $
                        {availableBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ready to trade
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-500/30" />
                  </div>
                </Card>

                {/* Amount Input Section */}
                <Card className="p-6 bg-card border-border">
                  <h3 className="text-xl font-semibold mb-6">
                    Purchase Amount
                  </h3>

                  <div className="space-y-6">
                    {/* Main Input */}
                    <div className="space-y-3">
                      <Label htmlFor="grams" className="text-base font-medium">
                        Amount to Buy (grams)
                      </Label>
                      <div className="relative">
                        <Input
                          id="grams"
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={grams}
                          onChange={(e) => setGrams(e.target.value)}
                          placeholder="0.00"
                          className="text-2xl h-16 pr-16 text-center font-mono"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium">
                          g
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Minimum purchase: 0.1 grams
                      </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        Quick Select
                      </Label>
                      <div className="grid grid-cols-4 gap-3">
                        {[1, 5, 10, 50].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="lg"
                            onClick={() => setGrams(amount.toString())}
                            className="h-12 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500 transition-all"
                          >
                            {amount}g
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Real-time Calculation Display */}
                    {gramsNum > 0 && (
                      <Card className="bg-secondary/30 border-secondary p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Gold Amount:
                            </span>
                            <span className="font-mono">
                              {gramsNum.toFixed(6)} g
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              USD Value:
                            </span>
                            <span className="font-mono">
                              ${subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </Card>

                {/* Validation Messages */}
                {gramsNum > 0 && gramsNum < 0.1 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">
                        Minimum Purchase Required
                      </p>
                      <p className="text-sm text-muted-foreground">
                        The minimum purchase amount is 0.1 grams of gold.
                      </p>
                    </div>
                  </div>
                )}

                {gramsNum > 0 && total > availableBalance && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-500">
                        Insufficient Balance
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You need ${total.toFixed(2)} but only have $
                        {availableBalance.toFixed(2)} available.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Summary & Benefits (1/3 width) */}
              <div className="space-y-6">
                {/* Purchase Summary */}
                <Card className="p-6 bg-card border-border">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Coins className="w-6 h-6 text-primary" />
                    Purchase Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Gold Amount</span>
                      <span className="font-mono font-medium">
                        {gramsNum.toFixed(6)} g
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">
                        Price per Gram
                      </span>
                      <span className="font-mono font-medium">
                        ${pricePerGram.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono font-medium">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">
                        Transaction Fee (1%)
                      </span>
                      <span className="font-mono font-medium text-green-500">
                        ${fee.toFixed(2)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center py-2">
                      <span className="text-lg font-semibold">Total Cost</span>
                      <span className="text-2xl font-bold text-primary">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Benefits Card */}
                <Card className="p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5 border-green-500/20">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    Why Choose GALLA.GOLD?
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Instant Purchase</p>
                        <p className="text-muted-foreground">
                          Buy at live market price
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">100% Backed</p>
                        <p className="text-muted-foreground">
                          Physical gold in certified vaults
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Physical Delivery</p>
                        <p className="text-muted-foreground">
                          Request shipment anytime
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">24/7 Trading</p>
                        <p className="text-muted-foreground">
                          Market never closes
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t border-border bg-card/50 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Secure transaction • Instant settlement • Competitive rates</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-8"
              >
                Cancel
              </Button>

              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={
                  !grams ||
                  gramsNum < 0.1 ||
                  total > availableBalance ||
                  isSubmitting
                }
                size="lg"
                className="px-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Buy Gold Now
              </Button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal Overlay */}
        {showConfirmation && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center">
            <Card className="max-w-md mx-4 p-8 border-border">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Confirm Purchase</h3>
                <p className="text-muted-foreground">
                  Please review your gold purchase details
                </p>
              </div>

              <div className="space-y-4 bg-secondary/30 rounded-lg p-6 mb-8">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Gold Amount</span>
                  <span className="font-bold font-mono">
                    {gramsNum.toFixed(6)} g
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-bold text-primary text-xl">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBuy}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Confirm Purchase
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * PROFESSIONAL DIALOG DESIGN:
 *
 * Layout:
 * - Full-screen: max-w-6xl w-[95vw] h-[90vh]
 * - Fixed header with title and controls
 * - Scrollable main content area
 * - Fixed footer with actions
 *
 * Content Organization:
 * - Left column (2/3): Form and inputs
 * - Right column (1/3): Summary and benefits
 * - Clear visual hierarchy
 * - Proper spacing and padding
 *
 * Backgrounds:
 * - Solid, opaque backgrounds
 * - Clear color contrast
 * - No transparency issues
 * - Professional appearance
 *
 * Accessibility:
 * - Large touch targets
 * - Clear labels and descriptions
 * - Keyboard navigation
 * - Screen reader friendly
 *
 * Responsive:
 * - Works on all screen sizes
 * - Adapts layout on mobile
 * - Proper viewport usage
 *
 * UX Principles:
 * - Clear information hierarchy
 * - Immediate feedback
 * - Error prevention and handling
 * - Confirmation flow
 * - Easy to scan and understand
 */
