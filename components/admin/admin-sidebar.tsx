// components/admin/admin-sidebar.tsx
// Purpose: Admin Sidebar Navigation - Main navigation menu for admin interface

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

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
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
    // ✅ REMOVED: badge - will add dynamic count later
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
    roles: ["admin", "superadmin", "auditor"],
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
    roles: ["admin", "superadmin"],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-500" />
              <span className="font-bold text-lg">GALLA.GOLD</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
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

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {/* ✅ REMOVED hardcoded badge */}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Admin Panel v1.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

export default AdminSidebar;
