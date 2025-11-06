// /app/admin/kyc/page.tsx
// KYC review queue with filtering and bulk actions

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

export default async function KYCQueuePage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    priority?: string;
    page?: string;
  };
}) {
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

  // Parse filters
  const filters = {
    status: searchParams.status || "pending",
    priority: searchParams.priority,
    page: parseInt(searchParams.page || "1"),
    limit: 12,
  };

  // Fetch KYC applications
  const result = await getPendingKYC(userId!, filters);
  const applications = result.success ? result.data?.applications || [] : [];
  const stats = result.data?.stats || {
    pending: 0,
    approved: 0,
    rejected: 0,
    avgProcessingTime: 0,
  };
  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500">KYC Review Queue</h1>
        <p className="text-zinc-400 mt-2">
          Review and process KYC verification applications
        </p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.pending || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Approved Today</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.approvedToday || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Rejected Today</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.rejectedToday || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Avg. Processing</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgProcessingTime || 0}h
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-amber-400" />
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard className="mb-6">
        <form className="flex flex-col md:flex-row gap-4">
          <select
            name="status"
            defaultValue={filters.status}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
          >
            <option value="pending">Pending Review</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Applications</option>
          </select>

          <select
            name="priority"
            defaultValue={filters.priority}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <Button type="submit" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>

          {hasPermission(userRole, PERMISSIONS.KYC_APPROVE) && (
            <Button type="button" variant="outline" className="ml-auto">
              <CheckCircle className="w-4 h-4 mr-2" />
              Bulk Approve
            </Button>
          )}
        </form>
      </AdminCard>

      {/* KYC Applications Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.length > 0 ? (
          applications.map((application: any) => (
            <KYCCard
              key={application._id}
              kyc={application}
              onApprove={() => {
                /* TODO */
              }}
              onReject={() => {
                /* TODO */
              }}
            />
          ))
        ) : (
          <div className="col-span-full">
            <AdminCard>
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No KYC applications found</p>
                <p className="text-sm text-zinc-500 mt-2">
                  {filters.status === "pending"
                    ? "No pending applications to review"
                    : "Try adjusting your filters"}
                </p>
              </div>
            </AdminCard>
          </div>
        )}
      </div>

      {/* Load More / Pagination */}
      {applications.length >= filters.limit && (
        <div className="flex justify-center mt-8">
          <a href={`?page=${filters.page + 1}&status=${filters.status}`}>
            <Button variant="outline">Load More Applications</Button>
          </a>
        </div>
      )}
    </>
  );
}
