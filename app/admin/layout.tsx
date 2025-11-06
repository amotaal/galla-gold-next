// /app/admin/layout.tsx
// Admin layout wrapper that ensures authentication and proper role access

import { redirect } from 'next/navigation';
import { hasAdminAccess } from '@/server/auth/session';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user has admin access (operator, admin, superadmin, or auditor)
  const hasAccess = await hasAdminAccess();
  
  if (!hasAccess) {
    // Redirect non-admin users to dashboard
    redirect('/dashboard');
  }

  // Wrap all admin pages in the admin shell for consistent layout
  return <AdminShell>{children}</AdminShell>;
}
