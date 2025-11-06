// /app/admin/users/[id]/page.tsx
// ✅ FIXED: Added serialization for user data to fix ObjectId error

import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getUserDetails, getUserActivity } from "@/server/actions/admin/users";
import { AdminCard, AdminBreadcrumb } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  AlertCircle,
  Ban,
  Key,
  Edit,
  ArrowLeft,
  CheckCircle,
  Clock,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { serializeDoc } from "@/lib/serialization";

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    operator: "bg-green-500/20 text-green-400 border-green-500/30",
    admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    superadmin: "bg-red-500/20 text-red-400 border-red-500/30",
    auditor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <Badge className={colors[role] || colors.user}>{role.toUpperCase()}</Badge>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const { id } = await params;

  const result = await getUserDetails(adminId, id);

  if (!result.success || !result.data) {
    notFound();
  }

  // ✅ CRITICAL FIX: Serialize user data to convert ObjectIds to strings
  const rawUser = result.data.user;
  const user = serializeDoc(rawUser);

  const stats = {
    totalTransactions: result.data?.transactionCount || 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    lastActivity: result.data?.lastTransaction?.createdAt,
  };
  const activity: any[] = [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { color: "bg-green-500/20 text-green-400", icon: CheckCircle },
      suspended: { color: "bg-red-500/20 text-red-400", icon: Ban },
      pending: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <>
      <AdminBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user.email },
        ]}
      />

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">User Details</h1>
          <p className="text-zinc-400 mt-2">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <AdminCard>
            <div className="text-center">
              <div className="w-24 h-24 bg-linear-to-br from-amber-400 to-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-black">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              <h2 className="text-xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-zinc-400">{user.email}</p>
              <div className="flex justify-center gap-2 mt-4">
                <RoleBadge role={user.role} />
                {getStatusBadge(user.status || "active")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-zinc-800">
              <Button variant="outline" size="sm">
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Key className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-3 h-3 mr-1" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="text-red-400">
                <Ban className="w-3 h-3 mr-1" />
                Suspend
              </Button>
            </div>
          </AdminCard>

          <AdminCard title="Account Information">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">User ID</span>
                <span className="text-white font-mono text-xs">{user._id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Phone</span>
                <span className="text-white">
                  {user.phone || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Joined</span>
                <span className="text-white">
                  {user.createdAt
                    ? format(new Date(user.createdAt), "MMM dd, yyyy")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Last Login</span>
                <span className="text-white">
                  {user.lastLoginAt
                    ? format(new Date(user.lastLoginAt), "MMM dd, yyyy")
                    : "Never"}
                </span>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="KYC Status">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Status</span>
                <Badge
                  className={
                    user.kycStatus === "verified"
                      ? "bg-green-500/20 text-green-400"
                      : user.kycStatus === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-zinc-500/20 text-zinc-400"
                  }
                >
                  {user.kycStatus || "None"}
                </Badge>
              </div>
              {user.kycStatus === "verified" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Verified Date</span>
                    <span className="text-white">
                      {user.kycVerifiedAt
                        ? format(new Date(user.kycVerifiedAt), "MMM dd, yyyy")
                        : "-"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Balance</p>
                  <p className="text-xl font-bold text-white">
                    ${user.balance?.toLocaleString() || 0}
                  </p>
                </div>
                <Coins className="w-8 h-8 text-amber-400" />
              </div>
            </AdminCard>

            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Gold Holdings</p>
                  <p className="text-2xl font-bold text-white">
                    {user.wallet?.gold?.grams
                      ? (user.wallet.gold.grams / 31.1035).toFixed(2)
                      : "0.00"}{" "}
                    oz
                  </p>
                </div>
                <Coins className="w-8 h-8 text-amber-400" />
              </div>
            </AdminCard>

            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Total Transactions</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.totalTransactions || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </AdminCard>
          </div>

          <AdminCard title="Recent Activity">
            {activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-white text-sm">{item.action}</p>
                        <p className="text-zinc-500 text-xs">
                          {format(
                            new Date(item.timestamp),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400">No recent activity</p>
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    </>
  );
}
