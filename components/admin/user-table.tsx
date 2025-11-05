// components/admin/user-table.tsx
// Purpose: User Table - Display and manage users with filtering and sorting

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserTableProps {
  users: User[];
  loading?: boolean;
  onSearch?: (query: string) => void;
  onFilterRole?: (role: string) => void;
  onFilterKYC?: (status: string) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getKYCBadge(status: string) {
  const variants: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    verified: { variant: "default", label: "Verified" },
    pending: { variant: "secondary", label: "Pending" },
    rejected: { variant: "destructive", label: "Rejected" },
    none: { variant: "outline", label: "None" },
  };

  const config = variants[status] || variants.none;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getRoleBadge(role: string) {
  const colors: Record<string, string> = {
    superadmin:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    operator:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    auditor:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    user: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <Badge className={colors[role] || colors.user} variant="outline">
      {role}
    </Badge>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// =============================================================================
// USER TABLE COMPONENT
// =============================================================================

/**
 * UserTable - Display users with search, filter, and management capabilities
 *
 * Features:
 * - Search by name or email
 * - Filter by role and KYC status
 * - Sort by various fields
 * - Status badges
 * - Quick actions
 * - Responsive design
 * - Pagination support
 */
export function UserTable({
  users,
  loading = false,
  onSearch,
  onFilterRole,
  onFilterKYC,
}: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <Select onValueChange={onFilterRole}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
          </SelectContent>
        </Select>

        {/* KYC Filter */}
        <Select onValueChange={onFilterKYC}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  {/* User Info */}
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>{getRoleBadge(user.role)}</TableCell>

                  {/* KYC Status */}
                  <TableCell>{getKYCBadge(user.kycStatus)}</TableCell>

                  {/* Account Status */}
                  <TableCell>
                    {user.isSuspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : user.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="text-sm">
                    {formatDate(user.lastLoginAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/users/${user._id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {users.length} users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTable;
