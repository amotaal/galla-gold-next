// components/admin/admin-header.tsx
// Purpose: Admin Header - Top navigation bar with user menu and quick actions

"use client";

import { useAuth } from "@/components/providers/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, User, Home } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { UserRole } from "@/types";

/**
 * AdminHeader - Top header bar for admin interface
 *
 * Features:
 * - User profile menu
 * - Notifications
 * - Quick navigation to client dashboard
 * - Sign out functionality
 */
export function AdminHeader() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Get user initials for avatar
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "AD";

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-card">
      {/* Left: Breadcrumbs or Page Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
      </div>

      {/* Right: User Menu & Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Back to Client Dashboard */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Client View
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {(user as any)?.role || "Admin"}{" "}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Client Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AdminHeader;
