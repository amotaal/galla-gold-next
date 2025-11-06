// /app/admin/kyc/page.tsx
// KYC review queue with filtering and bulk actions
// ✅ FIXED: Updated for Next.js 16 async searchParams
// ✅ FIXED: Proper avgProcessingTime handling from API response
// ✅ FIXED: Serialization for MongoDB documents

import { getSession } from "@/server/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getPendingKYC } from "@/server/actions/admin/kyc";
import { KYCCard } from "@/components/admin/kyc-card";
import { AdminSection, AdminCard } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileCheck,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { serializeDocs } from "@/lib/serialization";

/**
 * KYC Queue Page Component
 * Handles Next.js 16 async searchParams by awaiting the Promise
 */
export default async function KYCQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    page?: string;
  }>;
}) {
  // Get session and check permissions
  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || "user";

  // Check permissions
  if (!hasPermission(userRole, PERMISSIONS.KYC_VIEW)) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Access Denied</p>
        <p className="text-zinc-400 mt-2">
          You don't have permission to view KYC applications
        </p>
      </div>
    );
  }

  // ✅ CRITICAL FIX: Await searchParams before accessing its properties (Next.js 16 requirement)
  const params = await searchParams;

  // Parse filters from awaited params
  const filters = {
    status: params.status || "pending",
    priority: params.priority,
    page: parseInt(params.page || "1"),
    limit: 12,
  };

  // Fetch KYC applications
  const result = await getPendingKYC(userId!, filters);

  // ✅ CRITICAL FIX: Serialize applications before passing to client components
  const applications = result.success
    ? serializeDocs(result.data?.applications || [])
    : [];
  const totalPages = result.data?.totalPages || 1;
  const total = result.data?.total || 0;

  // ✅ CRITICAL FIX: Use avgProcessingTime from API response (not avgProcessing)
  const avgProcessingTime = result.data?.avgProcessingTime || 0;

  // Calculate stats from applications
  const stats = {
    pending: applications.filter(
      (app: any) => app.status === "pending" || app.status === "submitted"
    ).length,
    approved: applications.filter((app: any) => app.status === "verified")
      .length,
    rejected: applications.filter((app: any) => app.status === "rejected")
      .length,
    // Format average processing time as "Xh" or "Xd"
    avgProcessing:
      avgProcessingTime >= 24
        ? `${Math.round(avgProcessingTime / 24)}d`
        : `${Math.round(avgProcessingTime)}h`,
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">
              KYC Review Queue
            </h1>
            <p className="text-zinc-400 mt-2">
              Review and process KYC verification applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {hasPermission(userRole, PERMISSIONS.KYC_APPROVE) && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Bulk Approve
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.pending}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Awaiting action</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Approved</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.approved}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total approved</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Rejected</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.rejected}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total rejected</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Avg. Processing</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.avgProcessing}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Time to review</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search applications..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.status}
            >
              <option value="pending">Pending Review</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Status</option>
            </select>
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.priority || "all"}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* KYC Applications Grid */}
      {applications.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app: any) => (
            // ✅ FIXED: Pass kyc prop instead of application
            <KYCCard key={app._id} kyc={app} />
          ))}
        </div>
      ) : (
        <AdminCard>
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-zinc-400">
              No KYC applications found
            </p>
            <p className="text-zinc-500 mt-2">
              No pending applications to review
            </p>
          </div>
        </AdminCard>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" disabled={filters.page === 1}>
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <Button
                key={i + 1}
                variant={filters.page === i + 1 ? "default" : "outline"}
                size="sm"
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button variant="outline" disabled={filters.page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </>
  );
}
