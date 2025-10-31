// components/dashboard/dashboard-header.tsx
// Purpose: Header with GALLA.GOLD branding, live gold price, quick actions, and user menu

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  User,
  Settings,
  LogOut,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

interface DashboardHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  goldPrice: number;
}

export function DashboardHeader({ user, goldPrice }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-md flex-shrink-0 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Section - Branding */}
        <div className="flex items-center gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              {/* Gold bars animated icon */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-yellow-500 to-primary rounded animate-pulse-slow" />
              <div className="absolute inset-0.5 bg-background rounded" />
              <div className="absolute inset-1 bg-gradient-to-br from-primary via-yellow-500 to-primary rounded" />
            </div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-primary">
              GALLA.GOLD
            </h1>
          </div>
          
          {/* Divider */}
          <div className="h-6 w-px bg-border hidden md:block" />
          
          {/* Live Gold Price Ticker */}
          <Badge 
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-3 py-1.5 hidden md:flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm">
              XAU/USD ${goldPrice.toFixed(2)}
            </span>
            <Sparkles className="w-3 h-3" />
            <span className="text-xs">Live</span>
          </Badge>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors"
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
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card/95 backdrop-blur-md border-border"
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
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
