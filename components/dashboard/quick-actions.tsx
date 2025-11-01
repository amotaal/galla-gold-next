// /components/dashboard/quick-actions.tsx
// Quick Actions Component - GOLD STYLED WITH DIALOGS
// Purpose: Action buttons matching design sample with vibrant gold styling
// UPDATE: Proper gold colors, glass effects, and dialog integration

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
  ChevronRight,
} from "lucide-react";
import { BuyGoldDialog } from "@/components/dialogs/buy";

// Import other dialogs when created
// import { SellGoldDialog } from '@/components/dialogs/sell';
// import { DepositDialog } from '@/components/dialogs/deposit';
// import { WithdrawDialog } from '@/components/dialogs/withdraw';
// import { DeliveryDialog } from '@/components/dialogs/delivery';

/**
 * QuickActions - Action buttons with gold styling matching design sample
 *
 * Features:
 * - Vibrant gold colors
 * - Glass morphism effects
 * - Glowing hover states
 * - Opens dialogs instead of navigating
 * - Matches design sample aesthetic
 */
export function QuickActions() {
  // Dialog states
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

  // Action configurations with proper gold styling
  const actions = [
    {
      icon: Plus,
      label: "Buy Gold",
      description: "Purchase physical gold",
      // GOLD BUTTON - Bright gold gradient like design sample
      bgClass: "bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#FFB800]",
      hoverClass: "hover:shadow-gold-glow-strong hover:scale-105",
      iconClass: "text-black",
      textClass: "text-black font-bold",
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
      description: "Add money",
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
      onClick: () => {
        // Navigate to achievements page (keep as page, not dialog)
        window.location.href = "/dashboard/achievements";
      },
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

      {/* Dialogs */}
      <BuyGoldDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} />

      {/* TODO: Add other dialogs when created
      <SellGoldDialog 
        open={sellDialogOpen} 
        onOpenChange={setSellDialogOpen} 
      />
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
      */}
    </>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * GOLD STYLING BREAKDOWN:
 *
 * Buy Gold Button (Primary):
 * - bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#FFB800]
 * - Bright gold gradient matching design sample
 * - Black text for contrast
 * - Glowing hover effect
 *
 * Other Buttons:
 * - Colored backgrounds with transparency
 * - Border with same color
 * - Hover states increase opacity
 * - Icon color matches theme
 *
 * Glass Effect:
 * - glass-card class from globals.css
 * - Provides backdrop blur
 * - Semi-transparent background
 *
 *
 * DIALOG INTEGRATION:
 *
 * - onClick opens dialog instead of navigating
 * - Dialogs are rendered at component level
 * - State managed with useState
 * - User stays in dashboard context
 *
 *
 * TO ADD MORE DIALOGS:
 *
 * 1. Create dialog component (e.g., SellGoldDialog)
 * 2. Import at top of file
 * 3. Add state: const [dialogOpen, setDialogOpen] = useState(false)
 * 4. Render dialog: <SellGoldDialog open={dialogOpen} onOpenChange={setDialogOpen} />
 */
