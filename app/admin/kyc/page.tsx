// /app/admin/kyc/page.tsx
// KYC review queue with filtering and bulk actions
// FIXED: Updated for Next.js 16 async searchParams

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

  // IMPORTANT: Await searchParams before accessing its properties (Next.js 16 requirement)
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
  const applications = result.success ? result.data?.applications || [] : [];
  const totalPages = result.data?.totalPages || 1;
  const total = result.data?.total || 0;

  // Calculate stats from applications
  const stats = {
    pending: applications.filter((app: any) => app.status === "pending").length,
    approved: applications.filter((app: any) => app.status === "approved")
      .length,
    rejected: applications.filter((app: any) => app.status === "rejected")
      .length,
    avgProcessing: result.data?.avgProcessingTime || "0h",
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
            <Button
              variant="outline"
              size="sm"
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Bulk Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">
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
              <p className="text-2xl font-bold text-green-400 mt-1">
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
              <p className="text-2xl font-bold text-red-400 mt-1">
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
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {stats.avgProcessing}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Time to review</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </div>
        </AdminCard>
      </div>

      {/* Filters Section */}
      <AdminCard className="mb-6">
        <form method="GET" action="/admin/kyc">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <select
              name="status"
              defaultValue={filters.status}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Applications</option>
            </select>

            {/* Priority Filter */}
            <select
              name="priority"
              defaultValue={params.priority || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Apply Filters Button */}
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>

            {/* Clear Filters Link */}
            <a href="/admin/kyc">
              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-zinc-800"
              >
                Clear Filters
              </Button>
            </a>
          </div>
        </form>
      </AdminCard>

      {/* KYC Applications Grid */}
      <AdminCard>
        {applications.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app: any) => (
                <KYCCard key={app._id} application={app} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-zinc-800">
                {filters.page > 1 && (
                  <a
                    href={`?page=${filters.page - 1}${
                      params.status ? `&status=${params.status}` : ""
                    }${params.priority ? `&priority=${params.priority}` : ""}`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </a>
                )}

                <span className="flex items-center px-4 text-sm text-zinc-400">
                  Page {filters.page} of {totalPages}
                </span>

                {filters.page < totalPages && (
                  <a
                    href={`?page=${filters.page + 1}${
                      params.status ? `&status=${params.status}` : ""
                    }${params.priority ? `&priority=${params.priority}` : ""}`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No KYC applications found</p>
            <p className="text-sm text-zinc-500 mt-2">
              {filters.status === "pending"
                ? "No pending applications to review"
                : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </AdminCard>

      {/* Help Card */}
      <AdminCard className="mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-1" />
          <div>
            <h3 className="font-semibold text-white mb-2">Review Guidelines</h3>
            <p className="text-sm text-zinc-400">
              When reviewing KYC applications, verify that all documents are
              clear, valid, and match the user's information. Check for
              expiration dates, ensure photos are recent, and validate that
              personal details match across all documents. Flag any suspicious
              or incomplete applications for further review.
            </p>
          </div>
        </div>
      </AdminCard>
    </>
  );
}
