// components/admin/admin-shell.tsx
// Purpose: Admin Layout Shell - Wrapper component for entire admin interface
// Provides sidebar navigation, header, and main content area with responsive design

"use client";

import { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

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
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT
// =============================================================================

export default AdminShell;
