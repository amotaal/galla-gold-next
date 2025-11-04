// /components/dashboard/quick-actions.tsx
// Quick Actions Component - SURGICAL UPDATE
// Purpose: Action buttons with vibrant gold styling that open full-screen professional dialogs
// UPDATE: Added KYC and MFA dialogs - MINIMAL CHANGES ONLY

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Minus,
  ArrowDownToLine,
  Send,
  Package,
  Trophy,
  Shield,
  Key,
  ChevronRight,
} from "lucide-react";
import { BuyGoldDialog } from "@/components/dialogs/buy";
import { SellGoldDialog } from "@/components/dialogs/sell";
import { DepositDialog } from "@/components/dialogs/deposit";
import { WithdrawDialog } from "@/components/dialogs/withdraw";
import { DeliveryDialog } from "@/components/dialogs/delivery";
import { AchievementsDialog } from "@/components/dialogs/achievements";
import { KYCDialog } from "@/components/dialogs/kyc"; // ✅ NEW
import { MFADialog } from "@/components/dialogs/mfa"; // ✅ NEW
import { useAuth } from "../providers/auth";

/**
 * QuickActions - Action buttons with gold styling matching design sample
 *
 * Features:
 * - Vibrant gold colors and glass morphism effects
 * - Glowing hover states for interactivity
 * - Opens full-screen professional dialogs
 * - Matches fintech app design standards
 * - All dialogs properly integrated
 *
 * Dialog Integration:
 * ✅ Buy Gold - Purchase physical gold at live prices
 * ✅ Sell Gold - Convert gold to cash
 * ✅ Deposit - Add funds via bank/card
 * ✅ Withdraw - Transfer to bank account
 * ✅ Delivery - Request physical shipment
 * ✅ Verify ID - KYC verification (NEW)
 * ✅ Enable 2FA - Two-factor authentication (NEW)
 * ✅ Achievements - Gamified progress tracking dialog
 */
export function QuickActions() {
  // Dialog states - each action has its own state
  const { user } = useAuth(); // Import useAuth from "@/components/providers/auth"

  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [achievementsDialogOpen, setAchievementsDialogOpen] = useState(false);
  const [kycDialogOpen, setKycDialogOpen] = useState(false); // ✅ NEW
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false); // ✅ NEW

  // Action button configurations
  const actions = [
    {
      icon: Plus,
      label: "Buy Gold",
      description: "Purchase gold",
      // PRIMARY GOLD GRADIENT - Matches design sample exactly
      bgClass: "bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#FFB800]",
      hoverClass: "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/50",
      iconClass: "text-black",
      textClass: "text-black",
      onClick: () => setBuyDialogOpen(true),
    },
    {
      icon: Minus,
      label: "Sell Gold",
      description: "Convert to cash",
      bgClass: "bg-orange-500/10 border border-orange-500/30",
      hoverClass: "hover:bg-orange-500/20 hover:border-orange-500/50",
      iconClass: "text-orange-500",
      textClass: "text-foreground",
      onClick: () => setSellDialogOpen(true),
    },
    {
      icon: ArrowDownToLine,
      label: "Deposit",
      description: "Add funds",
      bgClass: "bg-blue-500/10 border border-blue-500/30",
      hoverClass: "hover:bg-blue-500/20 hover:border-blue-500/50",
      iconClass: "text-blue-500",
      textClass: "text-foreground",
      onClick: () => setDepositDialogOpen(true),
    },
    {
      icon: Send,
      label: "Withdraw",
      description: "To bank account",
      bgClass: "bg-purple-500/10 border border-purple-500/30",
      hoverClass: "hover:bg-purple-500/20 hover:border-purple-500/50",
      iconClass: "text-purple-500",
      textClass: "text-foreground",
      onClick: () => setWithdrawDialogOpen(true),
    },
    {
      icon: Package,
      label: "Physical Delivery",
      description: "Request shipment",
      bgClass: "bg-amber-500/10 border border-amber-500/30",
      hoverClass: "hover:bg-amber-500/20 hover:border-amber-500/50",
      iconClass: "text-amber-500",
      textClass: "text-foreground",
      onClick: () => setDeliveryDialogOpen(true),
    },
    // ✅ NEW: Verify ID (KYC)
    // KYC - Only show if NOT verified
    ...(user?.kycStatus !== "verified"
      ? [
          {
            icon: Shield,
            label: "Verify ID",
            description: "Complete KYC",
            bgClass: "bg-green-500/10 border border-green-500/30",
            hoverClass: "hover:bg-green-500/20 hover:border-green-500/50",
            iconClass: "text-green-500",
            textClass: "text-foreground",
            onClick: () => setKycDialogOpen(true),
          },
        ]
      : []),

    // MFA - Only show if NOT enabled
    ...(user?.mfaEnabled !== true
      ? [
          {
            icon: Key,
            label: "Enable 2FA",
            description: "Secure account",
            bgClass: "bg-pink-500/10 border border-pink-500/30",
            hoverClass: "hover:bg-pink-500/20 hover:border-pink-500/50",
            iconClass: "text-pink-500",
            textClass: "text-foreground",
            onClick: () => setMfaDialogOpen(true),
          },
        ]
      : []),
    {
      icon: Trophy,
      label: "Achievements",
      description: "View progress",
      // GOLD ACCENT - Second gold button
      bgClass: "bg-primary/10 border border-primary/30",
      hoverClass:
        "hover:bg-primary/20 hover:border-primary/50 hover:shadow-gold-glow",
      iconClass: "text-primary",
      textClass: "text-foreground",
      onClick: () => setAchievementsDialogOpen(true),
    },
  ];

  return (
    <>
      {/* Quick Actions Card */}
      <Card className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

        <div className="space-y-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                w-full p-4 rounded-xl
                ${action.bgClass}
                ${action.hoverClass}
                transition-all duration-300
                flex items-center justify-between
                group
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                  p-2.5 rounded-lg
                  ${index === 0 ? "bg-black/10" : "bg-background/50"}
                `}
                >
                  <action.icon className={`w-5 h-5 ${action.iconClass}`} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${action.textClass}`}>
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`
                w-5 h-5 
                ${index === 0 ? "text-black" : "text-muted-foreground"}
                group-hover:translate-x-1 transition-transform
              `}
              />
            </button>
          ))}
        </div>
      </Card>

      {/* All Dialogs - Rendered at component level */}
      <BuyGoldDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} />
      <SellGoldDialog open={sellDialogOpen} onOpenChange={setSellDialogOpen} />
      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
      />
      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      />
      <DeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
      />
      {/* ✅ NEW: KYC Dialog */}
      <KYCDialog open={kycDialogOpen} onOpenChange={setKycDialogOpen} />
      {/* ✅ NEW: MFA Dialog */}
      <MFADialog open={mfaDialogOpen} onOpenChange={setMfaDialogOpen} />
      <AchievementsDialog
        open={achievementsDialogOpen}
        onOpenChange={setAchievementsDialogOpen}
      />
    </>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * CHANGES MADE (SURGICAL):
 * ✅ Added Shield and Key icons to imports
 * ✅ Added kycDialogOpen and mfaDialogOpen states
 * ✅ Added "Verify ID" action button (green theme)
 * ✅ Added "Enable 2FA" action button (pink theme)
 * ✅ Added KYCDialog and MFADialog imports
 * ✅ Added KYCDialog and MFADialog components at bottom
 * ❌ NO OTHER CHANGES - Kept exact existing design
 *
 * DESIGN MAINTAINED:
 * - Same vertical list layout
 * - Same card styling
 * - Same hover effects
 * - Same color scheme
 * - Same spacing
 * - Same typography
 * - Same icon placement
 * - Same chevron animation
 */
