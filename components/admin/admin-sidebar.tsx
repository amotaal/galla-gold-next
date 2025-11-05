// components/admin/admin-sidebar.tsx
// Purpose: Admin Sidebar Navigation - Main navigation menu for admin interface
// Displays navigation links, active states, and role-based menu items

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Receipt,
  Settings,
  BarChart3,
  ScrollText,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// =============================================================================
// NAVIGATION ITEMS
// =============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[]; // If specified, only shown to these roles
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "KYC Review",
    href: "/admin/kyc",
    icon: FileCheck,
    badge: "pending", // Will show count of pending KYC
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: Receipt,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    roles: ["admin", "superadmin", "auditor"], // Only for these roles
  },
  {
    label: "Audit Logs",
    href: "/admin/audit",
    icon: ScrollText,
    roles: ["admin", "superadmin", "auditor"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin", "superadmin"], // Only admins can change settings
  },
];

// =============================================================================
// ADMIN SIDEBAR COMPONENT
// =============================================================================

/**
 * AdminSidebar - Navigation sidebar for admin interface
 * 
 * Features:
 * - Hierarchical navigation menu
 * - Active link highlighting
 * - Role-based menu items
 * - Badge notifications
 * - Collapsible on mobile
 * - Professional styling
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          "hidden lg:flex" // Hidden on mobile, visible on desktop
        )}
      >
        {/* Logo & Title */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">GALLA.GOLD</h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <Shield className="w-6 h-6 text-primary mx-auto" />
          )}
          
          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                            12
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Admin Panel v1.0
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar - Drawer/Sheet */}
      {/* TODO: Implement mobile drawer using Sheet component */}
    </>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default AdminSidebar;
