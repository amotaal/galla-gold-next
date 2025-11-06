// /app/admin/kyc/[id]/page.tsx
// KYC application detail review page with document viewer

import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import {
  getKYCDetails,
  approveKYC,
  rejectKYC,
} from "@/server/actions/admin/kyc";
import { KYCDocumentViewer } from "@/components/admin/kyc-document-viewer";
import { AdminCard, AdminBreadcrumb } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FileCheck,
  User,
  Calendar,
  Globe,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  ZoomIn,
  Shield,
} from "lucide-react";
import { format } from "date-fns";

export default async function KYCDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || "user";

  // Check view permissions
  if (!hasPermission(userRole, PERMISSIONS.KYC_VIEW)) {
    redirect("/admin");
  }

  // Fetch KYC application details
  const result = await getKYCDetails(userId!, params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const kyc = result.data.kyc;
  const user = result.data.user;
  const canApprove = hasPermission(userRole, PERMISSIONS.KYC_APPROVE);

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
      in_review: { color: "bg-blue-500/20 text-blue-400", icon: FileCheck },
      verified: { color: "bg-green-500/20 text-green-400", icon: CheckCircle },
      rejected: { color: "bg-red-500/20 text-red-400", icon: XCircle },
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
      <AdminBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "KYC Queue", href: "/admin/kyc" },
          { label: `Application #${params.id.slice(-6)}` },
        ]}
      />

      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">KYC Review</h1>
          <p className="text-zinc-400 mt-2">Application ID: {params.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(kyc.status)}
          {kyc.priority === "high" && (
            <Badge className="bg-red-500/20 text-red-400 border-0">
              <AlertCircle className="w-3 h-3 mr-1" />
              High Priority
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="space-y-6">
          {/* User Profile */}
          <AdminCard title="User Information">
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-zinc-800">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-black">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <h3 className="font-semibold text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-zinc-500 mr-3" />
                  <span className="text-zinc-400">Email:</span>
                  <span className="text-white ml-auto">{user.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-zinc-500 mr-3" />
                  <span className="text-zinc-400">Phone:</span>
                  <span className="text-white ml-auto">
                    {kyc.phone || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-zinc-500 mr-3" />
                  <span className="text-zinc-400">Date of Birth:</span>
                  <span className="text-white ml-auto">
                    {kyc.dateOfBirth
                      ? format(new Date(kyc.dateOfBirth), "MMM dd, yyyy")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Globe className="w-4 h-4 text-zinc-500 mr-3" />
                  <span className="text-zinc-400">Nationality:</span>
                  <span className="text-white ml-auto">
                    {kyc.nationality || "-"}
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Address Information */}
          <AdminCard title="Address">
            <div className="space-y-2 text-sm">
              <p className="text-white">{kyc.address}</p>
              <p className="text-zinc-400">
                {kyc.city && `${kyc.city}, `}
                {kyc.state && `${kyc.state}, `}
                {kyc.country}
              </p>
              <p className="text-zinc-400">{kyc.postalCode}</p>
            </div>
          </AdminCard>

          {/* Submission Info */}
          <AdminCard title="Application Info">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Submitted</span>
                <span className="text-white">
                  {format(new Date(kyc.submittedAt), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
              {kyc.reviewedBy && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Reviewed By</span>
                    <span className="text-white">{kyc.reviewedBy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Review Date</span>
                    <span className="text-white">
                      {format(new Date(kyc.reviewedAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Processing Time</span>
                <span className="text-white">
                  {Math.round(
                    (Date.now() - new Date(kyc.submittedAt).getTime()) /
                      (1000 * 60 * 60)
                  )}{" "}
                  hours
                </span>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Right Column - Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents Viewer */}
          <AdminCard title="Submitted Documents">
            <KYCDocumentViewer documents={kyc.documents} />
          </AdminCard>

          {/* Review Actions */}
          {kyc.status === "pending" && canApprove && (
            <AdminCard title="Review Decision">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Review Notes
                  </label>
                  <Textarea
                    name="notes"
                    placeholder="Add any notes about this KYC application..."
                    className="bg-zinc-900 border-zinc-800 min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    formAction={async (formData) => {
                      "use server";
                      const notes = formData.get("notes") as string;
                      await approveKYC(userId!, {
                        kycId: params.id,
                        reviewNotes: notes,
                      });
                      redirect("/admin/kyc");
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve KYC
                  </Button>

                  <Button
                    type="submit"
                    variant="destructive"
                    className="flex-1"
                    formAction={async (formData) => {
                      "use server";
                      const notes = formData.get("notes") as string;
                      if (!notes || notes.length < 10) {
                        return;
                      }
                      await rejectKYC(userId!, {
                        kycId: params.id,
                        rejectionReason: notes,
                      });
                      redirect("/admin/kyc");
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject KYC
                  </Button>
                </div>

                <Button type="button" variant="outline" className="w-full">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request Additional Documents
                </Button>
              </form>
            </AdminCard>
          )}

          {/* Review Result */}
          {kyc.status !== "pending" && (
            <AdminCard title="Review Result">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {kyc.status === "verified" ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="font-semibold text-green-400">
                          Application Approved
                        </p>
                        <p className="text-sm text-zinc-400">
                          Approved by {kyc.reviewedBy} on{" "}
                          {format(new Date(kyc.reviewedAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      <div>
                        <p className="font-semibold text-red-400">
                          Application Rejected
                        </p>
                        <p className="text-sm text-zinc-400">
                          Rejected by {kyc.reviewedBy} on{" "}
                          {format(new Date(kyc.reviewedAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {kyc.reviewNotes && (
                  <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
                    <p className="text-sm text-zinc-300">
                      <strong>Review Notes:</strong> {kyc.reviewNotes}
                    </p>
                  </div>
                )}

                {kyc.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                    <p className="text-sm text-red-300">
                      <strong>Rejection Reason:</strong> {kyc.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </>
  );
}
