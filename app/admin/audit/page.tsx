// /app/admin/audit/page.tsx
// Audit logs page for tracking all admin actions and system events

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

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: {
    action?: string;
    category?: string;
    userId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  };
}) {
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

  // Parse filters
  const filters = {
    action: searchParams.action,
    category: searchParams.category as
      | "user"
      | "auth"
      | "transaction"
      | "config"
      | "kyc"
      | "system"
      | undefined,
    userId: searchParams.userId,
    status: searchParams.status as
      | "success"
      | "failure"
      | "partial"
      | undefined,
    startDate: searchParams.dateFrom,
    endDate: searchParams.dateTo,
    page: parseInt(searchParams.page || "1"),
    limit: 20,
  };
  // Fetch audit logs
  const result = await searchAuditLogs(adminId!, filters);
  const logs = result.success ? result.data?.logs || [] : [];
  const totalPages = result.data?.totalPages || 1;

  // Get unique categories for filtering
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{logs.length}</p>
              <p className="text-sm text-zinc-400">Total Logs</p>
            </div>
            <Activity className="w-8 h-8 text-amber-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {logs.filter((log) => log.status === "success").length}
              </p>
              <p className="text-sm text-zinc-400">Successful</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {logs.filter((log) => log.status === "failure").length}
              </p>
              <p className="text-sm text-zinc-400">Failed</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {
                  logs.filter(
                    (log) =>
                      new Date(log.timestamp) >
                      new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length
                }
              </p>
              <p className="text-sm text-zinc-400">Last 24h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard className="mb-6">
        <form className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <select
              name="category"
              defaultValue={filters.category || "all"}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
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
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
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
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
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
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Date From */}
            <Input
              type="date"
              name="dateFrom"
              defaultValue={searchParams.dateFrom}
              className="bg-zinc-900 border-zinc-800"
            />

            {/* Date To */}
            <Input
              type="date"
              name="dateTo"
              defaultValue={searchParams.dateTo}
              className="bg-zinc-900 border-zinc-800"
            />

            {/* Search Button */}
            <Button type="submit" variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>

            {/* Clear Filters */}
            <a href="/admin/audit">
              <Button type="button" variant="outline" className="w-full">
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
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-800">
                <div className="text-sm text-zinc-400">
                  Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                  {Math.min(
                    filters.page * filters.limit,
                    result.data?.total || 0
                  )}{" "}
                  of {result.data?.total || 0} logs
                </div>

                <div className="flex gap-2">
                  {filters.page > 1 && (
                    <a
                      href={`?page=${filters.page - 1}${
                        filters.category ? `&category=${filters.category}` : ""
                      }`}
                    >
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </a>
                  )}

                  <span className="flex items-center px-4 text-sm">
                    Page {filters.page} of {totalPages}
                  </span>

                  {filters.page < totalPages && (
                    <a
                      href={`?page=${filters.page + 1}${
                        filters.category ? `&category=${filters.category}` : ""
                      }`}
                    >
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </a>
                  )}
                </div>
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

      {/* Info Section */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Retention Policy */}
        <AdminCard>
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-amber-400 mt-1" />
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

        {/* Compliance Note */}
        <AdminCard>
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-purple-400 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Compliance & Security
              </h3>
              <p className="text-sm text-zinc-400">
                This audit trail meets regulatory requirements for financial
                services. All sensitive actions are logged including user
                management, KYC reviews, transaction modifications, and
                configuration changes. Regular audits should be conducted to
                ensure compliance.
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Recent High-Risk Actions 
      {stats.highRiskActions && stats.highRiskActions.length > 0 && (
        <AdminCard title="Recent High-Risk Actions" className="mt-6">
          <div className="space-y-3">
            {stats.highRiskActions.map((action: any) => (
              <div
                key={action._id}
                className="flex items-center justify-between p-3 bg-red-900/20 border border-red-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {action.description}
                    </p>
                    <p className="text-xs text-zinc-400">
                      by {action.userEmail} •{" "}
                      {format(new Date(action.timestamp), "MMM dd, HH:mm")}
                    </p>
                  </div>
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-0">
                  {action.action}
                </Badge>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
        */}
    </>
  );
}
