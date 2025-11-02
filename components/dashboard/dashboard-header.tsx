// /components/dashboard/dashboard-header.tsx
// Dashboard Header - GOLD STYLED VERSION
// Purpose: Header with vibrant gold logo and proper styling
// UPDATE: Gold logo, theme toggle, matches design sample

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, User, Settings, LogOut, TrendingUp, Circle } from "lucide-react";
import { signOut } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "../logo";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DashboardHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  goldPrice: number;
}

// ============================================================================
// DASHBOARD HEADER COMPONENT
// ============================================================================

/**
 * DashboardHeader - Top navigation with gold styling
 *
 * Features:
 * - GOLD LOGO with gradient and glow
 * - Live gold price ticker
 * - Theme toggle
 * - Notifications
 * - User dropdown menu
 * - Matches design sample aesthetic
 */
export function DashboardHeader({ user, goldPrice }: DashboardHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  const handleProfile = () => router.push("/dashboard/profile");
  const handleSettings = () => router.push("/dashboard/settings");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section - GOLD LOGO */}
        <Logo />

        {/* Center Section - GOLD PRICE BADGE */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-linear-to-r from-[#FFD700]/10 via-[#FFC107]/10 to-[#FFB800]/10 text-primary border-primary/20 px-3 py-1.5 text-sm font-semibold shadow-gold-glow"
          >
            <TrendingUp className="w-3 h-3 mr-1.5" />
            XAU/USD ${goldPrice.toFixed(2)}
          </Badge>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 animate-pulse fill-green-500 text-green-500" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Live
            </span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {/* Notification badge with gold accent */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-gold-glow" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-primary/50 hover:shadow-gold-glow transition-all"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.firstName}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 glass-card border-border"
            >
              {/* User Info */}
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>

              <DropdownMenuSeparator className="bg-border" />

              {/* Menu Items */}
              <DropdownMenuItem
                onClick={handleProfile}
                className="cursor-pointer text-foreground hover:text-foreground hover:bg-secondary/50 focus:bg-secondary/50 focus:text-foreground"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSettings}
                className="cursor-pointer text-foreground hover:text-foreground hover:bg-secondary/50 focus:bg-secondary/50 focus:text-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// NOTES FOR DEVELOPERS
// =============================================================================

/*
 * GOLD LOGO STYLING:
 *
 * Logo Container:
 * - bg-linear-to-br from-[#FFD700] via-[#FFC107] to-[#FFB800]
 * - shadow-gold-glow class for glow effect
 * - Blur effect underneath for additional glow
 *
 * Brand Name:
 * - bg-linear-to-r from-[#FFD700] via-[#FFC107] to-[#FFB800]
 * - bg-clip-text text-transparent for gradient text
 *
 * Gold Price Badge:
 * - Gold gradient background
 * - Primary color text
 * - Gold border
 * - Glow effect
 *
 * Notification Badge:
 * - bg-primary (gold)
 * - Pulse animation
 * - Glow effect
 *
 * User Avatar:
 * - Hover: border-primary/50
 * - Hover: shadow-gold-glow
 * - Gold gradient background for initials
 *
 *
 * DESIGN PRINCIPLES:
 *
 * - Gold is the primary visual accent
 * - Glowing effects on interactive elements
 * - Glass morphism on dropdown
 * - Smooth transitions
 * - Matches design sample aesthetic
 */
