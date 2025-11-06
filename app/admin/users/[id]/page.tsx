// /app/admin/users/[id]/page.tsx
// Individual user detail page with full profile and management options

import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/session';
import { getUserDetails, getUserActivity } from '@/server/actions/admin/users';
import { AdminCard, AdminBreadcrumb } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/admin/admin-sidebar';
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
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default async function UserDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await requireAdmin();
  const adminId = session.user.id;

  // Fetch user details
  const result = await getUserDetails(adminId, params.id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data.user;
  const stats = result.data.stats;
  const activity = result.data.recentActivity || [];

  // Status badges
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      suspended: { color: 'bg-red-500/20 text-red-400', icon: Ban },
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock }
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
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Users', href: '/admin/users' },
        { label: user.email }
      ]} />

      {/* Page Header */}
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
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <AdminCard>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-black">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <h2 className="text-xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-zinc-400">{user.email}</p>
              <div className="flex justify-center gap-2 mt-4">
                <RoleBadge role={user.role} />
                {getStatusBadge(user.status || 'active')}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-zinc-800">
              <Button variant="outline" size="sm">
                <Edit className="w-3 h-3 mr-1" />
                Edit User
              </Button>
              <Button variant="outline" size="sm">
                <Key className="w-3 h-3 mr-1" />
                Reset Pass
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-3 h-3 mr-1" />
                Send Email
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Ban className="w-3 h-3 mr-1" />
                Suspend
              </Button>
            </div>
          </AdminCard>

          {/* Contact Information */}
          <AdminCard title="Contact Information">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-zinc-500 mr-3" />
                <span className="text-zinc-400">Email:</span>
                <span className="text-white ml-auto">{user.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-zinc-500 mr-3" />
                <span className="text-zinc-400">Phone:</span>
                <span className="text-white ml-auto">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-zinc-500 mr-3" />
                <span className="text-zinc-400">Joined:</span>
                <span className="text-white ml-auto">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </AdminCard>

          {/* KYC Status */}
          <AdminCard title="KYC Information">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Status</span>
                {getStatusBadge(user.kycStatus || 'pending')}
              </div>
              {user.kycStatus === 'verified' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Verified Date</span>
                    <span className="text-white">
                      {user.kycVerifiedAt ? format(new Date(user.kycVerifiedAt), 'MMM dd, yyyy') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Document Type</span>
                    <span className="text-white">Passport</span>
                  </div>
                </>
              )}
              {user.kycStatus === 'pending' && (
                <Link href={`/admin/kyc/${user._id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Review KYC Application
                  </Button>
                </Link>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Right Column - Activity & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Statistics */}
          <div className="grid md:grid-cols-3 gap-4">
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Balance</p>
                  <p className="text-xl font-bold text-white">
                    ${stats?.totalBalance?.toLocaleString() || 0}
                  </p>
                </div>
                <Coins className="w-8 h-8 text-amber-400" />
              </div>
            </AdminCard>
            
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">Gold Holdings</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.goldBalance?.toFixed(2) || 0} oz
                  </p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400" />
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

          {/* Recent Activity */}
          <AdminCard title="Recent Activity">
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === 'deposit' || item.type === 'buy' 
                          ? 'bg-green-500/20' 
                          : 'bg-red-500/20'
                      }`}>
                        {item.type === 'deposit' || item.type === 'buy' ? (
                          <ArrowDownRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">
                          {item.type} {item.type.includes('gold') ? 'Gold' : ''}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        ${item.amount?.toLocaleString() || 0}
                      </p>
                      {item.goldAmount && (
                        <p className="text-xs text-zinc-500">
                          {item.goldAmount.toFixed(4)} oz
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No recent activity</p>
              </div>
            )}
          </AdminCard>

          {/* Account Settings */}
          <AdminCard title="Account Settings">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Two-Factor Auth</span>
                <Badge className={user.mfaEnabled ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}>
                  {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Email Verified</span>
                <Badge className={user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Last Login</span>
                <span className="text-sm text-white">
                  {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, HH:mm') : 'Never'}
                </span>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
