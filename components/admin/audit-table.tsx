// components/admin/audit-table.tsx
// Purpose: Audit Table - Display audit log entries

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLog {
  _id: string;
  userEmail: string;
  userRole: string;
  action: string;
  category: string;
  description: string;
  status: string;
  timestamp: string;
  ipAddress: string;
}

interface AuditTableProps {
  logs: AuditLog[];
  loading?: boolean;
}

export function AuditTable({ logs, loading }: AuditTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      success: "default",
      failure: "destructive",
      partial: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      user: "text-blue-600",
      kyc: "text-green-600",
      transaction: "text-purple-600",
      config: "text-orange-600",
      system: "text-red-600",
      auth: "text-gray-600",
    };
    return colors[category] || "text-gray-600";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Loading...
              </TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No audit logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{log.userEmail}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {log.userRole}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {log.action}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getCategoryColor(log.category)}
                  >
                    {log.category}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {log.description}
                </TableCell>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default AuditTable;
