// /app/admin/users/page.tsx
// User management page with search, filters, and actions
// ✅ FIXED: Properly serializing user data before passing to client components
// ✅ FIXED: Properly awaiting searchParams Promise

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
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { serializeDocs } from "@/lib/serialization";

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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await requireAdmin();
  const userId = session.user.id;

  // ✅ CRITICAL FIX: Await searchParams BEFORE using it (Next.js 16)
  const params = await searchParams;

  // Now parse search parameters from awaited params
  const page = parseInt(params.page || "1");
  const filters = {
    search: params.q,
    role: params.role,
    status: params.status,
    page,
    limit: 20,
  };

  // Fetch users with filters
  const result = await searchUsers(userId, filters);

  // ✅ CRITICAL FIX: Serialize users before passing to client components
  const users = result.success ? serializeDocs(result.data?.users || []) : [];
  const totalPages = result.data?.totalPages || 1;
  const total = result.data?.total || 0;

  // Calculate statistics
  const stats = {
    total,
    verified: users.filter((u: any) => u.kycStatus === "verified").length,
    pending: users.filter((u: any) => u.kycStatus === "pending").length,
    suspended: users.filter((u: any) => u.isSuspended).length,
  };

  return (
    <>
      {/* Page Header */}
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
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
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
            <CheckCircle className="w-8 h-8 text-green-500" />
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
            <Clock className="w-8 h-8 text-yellow-500" />
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
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </AdminCard>
      </div>

      {/* Filters and Search */}
      <AdminCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="pl-10"
                defaultValue={filters.search}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.role || "all"}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
              <option value="auditor">Auditor</option>
            </select>
            <select
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              defaultValue={filters.status || "all"}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* User Table */}
      <AdminCard>
        <UserTable users={users} />
      </AdminCard>
    </>
  );
}
