// /app/admin/audit/page.tsx
// Audit logs page for tracking all admin actions and system events
// FIXED: Updated for Next.js 16 async searchParams

import { getSession } from "@/server/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { searchAuditLogs } from "@/server/actions/admin/audit";
import { AuditTable } from "@/components/admin/audit-table";
import { AdminCard, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Shield,
  User,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

/**
 * Audit Logs Page Component
 * Handles Next.js 16 async searchParams by awaiting the Promise
 */
export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    category?: string;
    userId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
  // Get session and check permissions
  const session = await getSession();
  const adminId = session?.user?.id;
  const userRole = session?.user?.role || "user";

  // Check permissions - only superadmins and auditors can view audit logs
  if (!["superadmin", "auditor"].includes(userRole)) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Access Denied</p>
        <p className="text-zinc-400 mt-2">
          Only Super Admins and Auditors can view audit logs
        </p>
      </div>
    );
  }

  // IMPORTANT: Await searchParams before accessing its properties (Next.js 16 requirement)
  const params = await searchParams;

  // Parse filters from awaited params
  const filters = {
    action: params.action,
    category: params.category as
      | "user"
      | "auth"
      | "transaction"
      | "config"
      | "kyc"
      | "system"
      | undefined,
    userId: params.userId,
    status: params.status as "success" | "failure" | "partial" | undefined,
    startDate: params.dateFrom,
    endDate: params.dateTo,
    page: parseInt(params.page || "1"),
    limit: 20,
  };

  // Fetch audit logs
  const result = await searchAuditLogs(adminId!, filters);
  const logs = result.success ? result.data?.logs || [] : [];
  const totalPages = result.data?.totalPages || 1;

  // Get unique categories and actions for filtering
  const categories = [
    "all",
    "user",
    "kyc",
    "transaction",
    "config",
    "system",
    "security",
  ];
  const actions = [
    "all",
    "create",
    "update",
    "delete",
    "approve",
    "reject",
    "suspend",
    "login",
    "logout",
  ];

  // Calculate stats from logs
  const stats = {
    total: result.data?.total || 0,
    successful: logs.filter((log: any) => log.status === "success").length,
    failed: logs.filter((log: any) => log.status === "failure").length,
    last24h: logs.filter(
      (log: any) =>
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">Audit Logs</h1>
            <p className="text-zinc-400 mt-2">
              Complete audit trail of all admin actions and system events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-0">
              <Shield className="w-3 h-3 mr-1" />
              {userRole === "superadmin" ? "Super Admin" : "Auditor"}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Logs</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.total}
              </p>
            </div>
            <Activity className="w-8 h-8 text-amber-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Successful</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {stats.successful}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Failed</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {stats.failed}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Last 24h</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {stats.last24h}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </AdminCard>
      </div>

      {/* Filters Section */}
      <AdminCard className="mb-6">
        <form method="GET" action="/admin/audit">
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            {/* Category Filter */}
            <select
              name="category"
              defaultValue={filters.category || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat === "all" ? "" : cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              name="action"
              defaultValue={filters.action || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {actions.map((action) => (
                <option key={action} value={action === "all" ? "" : action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              name="status"
              defaultValue={filters.status || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failed</option>
              <option value="pending">Pending</option>
            </select>

            {/* User ID Search */}
            <Input
              type="text"
              name="userId"
              placeholder="User ID or Email"
              defaultValue={filters.userId}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />

            {/* Apply Filters Button */}
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Date From */}
            <Input
              type="date"
              name="dateFrom"
              defaultValue={params.dateFrom}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />

            {/* Date To */}
            <Input
              type="date"
              name="dateTo"
              defaultValue={params.dateTo}
              className="bg-zinc-900 border-zinc-800 focus:ring-2 focus:ring-amber-500"
            />

            {/* Clear Filters */}
            <a href="/admin/audit">
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

      {/* Audit Logs Table */}
      <AdminCard>
        {logs.length > 0 ? (
          <>
            <AuditTable logs={logs} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-zinc-800">
                {filters.page > 1 && (
                  <a
                    href={`?page=${filters.page - 1}${
                      params.action ? `&action=${params.action}` : ""
                    }${params.category ? `&category=${params.category}` : ""}${
                      params.status ? `&status=${params.status}` : ""
                    }${params.userId ? `&userId=${params.userId}` : ""}${
                      params.dateFrom ? `&dateFrom=${params.dateFrom}` : ""
                    }${params.dateTo ? `&dateTo=${params.dateTo}` : ""}`}
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
                      params.action ? `&action=${params.action}` : ""
                    }${params.category ? `&category=${params.category}` : ""}${
                      params.status ? `&status=${params.status}` : ""
                    }${params.userId ? `&userId=${params.userId}` : ""}${
                      params.dateFrom ? `&dateFrom=${params.dateFrom}` : ""
                    }${params.dateTo ? `&dateTo=${params.dateTo}` : ""}`}
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
            <ScrollText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No audit logs found</p>
            <p className="text-sm text-zinc-500 mt-2">
              Try adjusting your filters or date range
            </p>
          </div>
        )}
      </AdminCard>

      {/* Retention Policy and Compliance Info */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <AdminCard>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Retention Policy
              </h3>
              <p className="text-sm text-zinc-400">
                Audit logs are retained indefinitely for compliance purposes.
                Logs cannot be modified or deleted once created. All admin
                actions are automatically logged with full context including IP
                address, user agent, and timestamp.
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-500 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Compliance & Security
              </h3>
              <p className="text-sm text-zinc-400">
                This audit trail meets regulatory requirements for financial
                services. All sensitive actions are logged including user
                management, KYC decisions, transaction modifications, and
                configuration changes. Regular audits should be conducted to
                ensure compliance.
              </p>
            </div>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
