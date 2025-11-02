// /components/dashboard/quick-actions.tsx
// Quick Actions Component - FULLY INTEGRATED WITH ALL DIALOGS
// Purpose: Action buttons with vibrant gold styling that open full-screen professional dialogs
// UPDATE: All dialogs integrated and properly imported

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
import { SellGoldDialog } from "@/components/dialogs/sell";
import { DepositDialog } from "@/components/dialogs/deposit";
import { WithdrawDialog } from "@/components/dialogs/withdraw";
import { DeliveryDialog } from "@/components/dialogs/delivery";
import { AchievementsDialog } from "@/components/dialogs/achievements";

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
 * ✅ Achievements - Gamified progress tracking dialog
 */
export function QuickActions() {
  // Dialog states - each action has its own state
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [achievementsDialogOpen, setAchievementsDialogOpen] = useState(false);

  // Action configurations with proper gold styling
  const actions = [
    {
      icon: Plus,
      label: "Buy Gold",
      description: "Purchase physical gold",
      // GOLD BUTTON - Bright gold gradient like design sample
      bgClass: "bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFB800]",
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
 * GOLD STYLING BREAKDOWN:
 *
 * Buy Gold Button (Primary):
 * - bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFB800]
 * - Bright gold gradient matching design sample
 * - Black text for maximum contrast
 * - Strong glowing hover effect
 * - Scale animation on hover
 *
 * Other Action Buttons:
 * - Color-coded by function (orange=sell, blue=deposit, purple=withdraw, amber=delivery)
 * - Semi-transparent backgrounds with borders
 * - Hover states increase opacity and border visibility
 * - Icon color matches the action theme
 * - Smooth transitions for all states
 *
 * Glass Effect:
 * - glass-card class from globals.css
 * - Provides backdrop blur and transparency
 * - Semi-transparent background
 * - Professional modern appearance
 *
 *
 * DIALOG INTEGRATION:
 *
 * All dialogs use the FullScreenDialog component which:
 * - Takes 95% of viewport width (w-[95vw])
 * - Takes 90% of viewport height (h-[90vh])
 * - Max width of 72rem/1152px for large screens
 * - Fixed header and footer with scrollable content
 * - Solid backgrounds with proper contrast
 * - Professional fintech app design
 *
 * Dialog States:
 * - Each dialog has its own useState for open/close
 * - onClick handlers set the respective dialog state to true
 * - Dialogs handle their own closing via onOpenChange
 * - User stays in dashboard context (no navigation)
 *
 *
 * USER EXPERIENCE:
 *
 * Flow:
 * 1. User clicks action button → Dialog opens full-screen
 * 2. User fills form → Sees real-time calculations
 * 3. User clicks confirm → Confirmation screen
 * 4. User confirms → Backend action → Success toast → Dialog closes
 * 5. Dashboard automatically refreshes to show new data
 *
 * Benefits:
 * - No page navigation (stays in dashboard)
 * - Clear visual hierarchy and information
 * - Real-time feedback and validation
 * - Professional confirmation flow
 * - Accessible and mobile-friendly
 *
 *
 * BACKEND INTEGRATION:
 *
 * Each dialog calls its respective server action:
 * - BuyGoldDialog → buyGoldAction(formData)
 * - SellGoldDialog → sellGoldAction(formData)
 * - DepositDialog → depositAction(formData)
 * - WithdrawDialog → withdrawAction(formData)
 * - DeliveryDialog → [To be implemented on backend]
 *
 * After successful action:
 * - Toast notification confirms success
 * - useWallet hook's refetchAll() updates balances
 * - Dialog automatically closes
 * - Dashboard shows updated data
 *
 *
 * DESIGN PRINCIPLES APPLIED:
 *
 * ✅ Full-screen modals for important financial actions
 * ✅ Clear visual hierarchy with cards and sections
 * ✅ Large touch targets for mobile-friendly design
 * ✅ Real-time feedback and live calculations
 * ✅ Professional color scheme with proper contrast
 * ✅ Accessible design with proper labels and focus states
 * ✅ Confirmation flow to prevent accidental actions
 * ✅ Responsive layout that works on all screen sizes
 * ✅ Consistent design language across all dialogs
 * ✅ Industry-standard fintech UX patterns
 */
