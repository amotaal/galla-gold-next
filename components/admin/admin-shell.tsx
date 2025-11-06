// components/admin/admin-shell.tsx
// Purpose: Admin Layout Shell - Wrapper component for entire admin interface
// Provides sidebar navigation, header, and main content area with responsive design
// ✅ FIXED: Added title and icon props to AdminSection component

"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import Link from "next/link";
import React from "react";
import { LucideIcon } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface AdminShellProps {
  children: ReactNode;
}

// =============================================================================
// ADMIN SHELL COMPONENT
// =============================================================================

/**
 * AdminShell - Main layout wrapper for admin interface
 *
 * Features:
 * - Responsive sidebar (collapsible on mobile)
 * - Fixed header with user menu
 * - Scrollable main content area
 * - Professional admin styling
 * - Mobile-first design
 *
 * Usage:
 * <AdminShell>
 *   <YourAdminPage />
 * </AdminShell>
 */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - Fixed at top */}
        <AdminHeader />

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto p-6 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default AdminShell;

// =============================================================================
// ADDITIONAL EXPORTS FOR ADMIN PAGES
// =============================================================================

/**
 * AdminSection - Section wrapper with consistent spacing and optional header
 * ✅ FIXED: Added title and icon props
 */
export function AdminSection({
  children,
  title,
  icon: Icon,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <section className={`space-y-6 ${className}`}>
      {/* Optional section header with icon */}
      {title && (
        <div className="flex items-center gap-3 mb-6">
          {Icon && <Icon className="w-6 h-6 text-amber-500" />}
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * AdminCard - Consistent card styling for admin interface
 */
export function AdminCard({
  children,
  title,
  action,
  className = "",
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 ${className}`}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * AdminBreadcrumb - Breadcrumb navigation
 */
export function AdminBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-zinc-400 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
