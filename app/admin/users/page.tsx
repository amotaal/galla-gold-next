// /app/admin/users/page.tsx
// User management page with search, filters, and actions

import { getSession, requireAdmin } from "@/server/auth/session";
import { searchUsers } from "@/server/actions/admin/users";
import { UserTable } from "@/components/admin/user-table";
import { AdminSection, AdminCard } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Add this helper function right after imports:
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    user: "bg-blue-500/20 text-blue-400",
    operator: "bg-green-500/20 text-green-400",
    admin: "bg-purple-500/20 text-purple-400",
    superadmin: "bg-red-500/20 text-red-400",
    auditor: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <Badge className={`${colors[role] || colors.user} border-0`}>{role}</Badge>
  );
}

// Server component for initial data fetching
async function UsersPageContent({
  searchParams,
}: {
  searchParams: {
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  };
}) {
  const session = await requireAdmin();
  const userId = session.user.id;

  // Parse search parameters
  const page = parseInt(searchParams.page || "1");
  const filters = {
    search: searchParams.q,
    role: searchParams.role,
    status: searchParams.status,
    page,
    limit: 20,
  };

  // Fetch users with filters
  const result = await searchUsers(userId, filters);
  const users = result.success ? result.data?.users || [] : [];
  const totalPages = result.data?.totalPages || 1;
  const totalUsers = result.data?.total || 0;

  // Calculate stats
  const stats = {
    total: totalUsers,
    verified: users.filter((u: any) => u.kycStatus === "verified").length,
    pending: users.filter((u: any) => u.kycStatus === "pending").length,
    suspended: users.filter((u: any) => u.status === "suspended").length,
  };

  return (
    <>
      {/* Page Header with Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">
              User Management
            </h1>
            <p className="text-zinc-400 mt-2">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-amber-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Verified</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.verified}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Pending KYC</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.pending}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Suspended</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.suspended}
              </p>
            </div>
            <Shield className="w-8 h-8 text-red-400" />
          </div>
        </AdminCard>
      </div>

      {/* Search and Filters */}
      <AdminCard className="mb-6">
        <form className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              name="q"
              placeholder="Search by name, email, or ID..."
              defaultValue={searchParams.q}
              className="pl-10 bg-zinc-900 border-zinc-800"
            />
          </div>

          <select
            name="role"
            defaultValue={searchParams.role}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
            <option value="auditor">Auditor</option>
          </select>

          <select
            name="status"
            defaultValue={searchParams.status}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          <Button type="submit" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>

          <Button type="button" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </form>
      </AdminCard>

      {/* Users Table */}
      <AdminCard>
        {users.length > 0 ? (
          <>
            <UserTable users={users} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-zinc-800">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${
                      searchParams.q ? `&q=${searchParams.q}` : ""
                    }`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </a>
                )}

                <span className="flex items-center px-4 text-sm text-zinc-400">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}${
                      searchParams.q ? `&q=${searchParams.q}` : ""
                    }`}
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
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No users found</p>
            <p className="text-sm text-zinc-500 mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </AdminCard>
    </>
  );
}

export default function UsersPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  };
}) {
  return <UsersPageContent searchParams={searchParams} />;
}
