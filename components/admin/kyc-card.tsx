// components/admin/kyc-card.tsx
// Purpose: KYC Card - Display KYC application summary with quick actions

"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

// =============================================================================
// TYPES
// =============================================================================

interface KYCCardProps {
  kyc: {
    _id: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    status: string;
    submittedAt?: string;
    documents: any[];
  };
  onApprove?: (kycId: string) => void;
  onReject?: (kycId: string) => void;
}

// =============================================================================
// KYC CARD COMPONENT
// =============================================================================

/**
 * KYCCard - Display KYC application summary
 *
 * Features:
 * - User information
 * - Status badge
 * - Document count
 * - Submission date
 * - Quick action buttons
 * - Link to detailed review
 */
export function KYCCard({ kyc, onApprove, onReject }: KYCCardProps) {
  const user = kyc.userId;
  const initials = `${user.firstName?.[0] || ""}${
    user.lastName?.[0] || ""
  }`.toUpperCase();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge variant={kyc.status === "pending" ? "secondary" : "outline"}>
            {kyc.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Submitted:</span>
          <span className="font-medium">{formatDate(kyc.submittedAt)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Documents:</span>
          <span className="font-medium">
            {kyc.documents?.length || 0} files
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/admin/kyc/${kyc._id}`}>
            <Eye className="w-4 h-4 mr-2" />
            Review
          </Link>
        </Button>
        {kyc.status === "pending" && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => onApprove?.(kyc._id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject?.(kyc._id)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default KYCCard;
