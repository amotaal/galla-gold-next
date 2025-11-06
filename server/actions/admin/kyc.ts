// server/actions/admin/kyc.ts
// Purpose: Admin KYC Management Actions
// Allows administrators to review, approve, reject KYC applications
// Includes document viewing, status management, and compliance tracking

"use server";

import { z } from "zod";
import dbConnect from "@/server/db/connect";
import User from "@/server/models/User";
import KYC from "@/server/models/KYC";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { auditKYCAction, auditFailure } from "@/server/lib/audit";
import { sendEmail } from "@/server/email/send";

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const kycApprovalSchema = z.object({
  kycId: z.string(),
  reviewNotes: z.string().optional(),
});

const kycRejectionSchema = z.object({
  kycId: z.string(),
  rejectionReason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters"),
  reviewNotes: z.string().optional(),
});

const kycFiltersSchema = z.object({
  status: z
    .enum(["none", "pending", "submitted", "verified", "rejected"])
    .optional(),
  limit: z.number().min(1).max(100).default(50),
  skip: z.number().min(0).default(0),
  sortBy: z.enum(["submittedAt", "createdAt"]).default("submittedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function verifyKYCPermission(
  adminId: string,
  permission: string
): Promise<{
  success: boolean;
  admin?: any;
  error?: string;
}> {
  await dbConnect();

  const admin = await User.findById(adminId);
  if (!admin) {
    return { success: false, error: "Admin user not found" };
  }

  if (!hasPermission(admin.role, permission as any)) {
    return {
      success: false,
      error: `Insufficient permissions: ${permission} required`,
    };
  }

  return { success: true, admin };
}

// =============================================================================
// KYC QUEUE & LISTING
// =============================================================================

/**
 * Get KYC applications queue
 * Permission: KYC_VIEW
 */
export async function getKYCQueue(
  adminId: string,
  filters: Partial<z.infer<typeof kycFiltersSchema>> = {}
): Promise<{
  success: boolean;
  data?: {
    applications: any[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyKYCPermission(adminId, PERMISSIONS.KYC_VIEW);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    const validated = kycFiltersSchema.parse(filters);

    await dbConnect();

    // Build query
    const query: any = {};
    if (validated.status) {
      query.status = validated.status;
    } else {
      // Default: show pending and submitted only
      query.status = { $in: ["pending", "submitted"] };
    }

    // Execute query with user population
    const [applications, total] = await Promise.all([
      KYC.find(query)
        .populate("userId", "firstName lastName email phone")
        .sort({ [validated.sortBy]: validated.sortOrder === "asc" ? 1 : -1 })
        .limit(validated.limit)
        .skip(validated.skip)
        .lean(),
      KYC.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        applications,
        total,
        page: Math.floor(validated.skip / validated.limit) + 1,
        totalPages: Math.ceil(total / validated.limit),
      },
    };
  } catch (error: any) {
    console.error("Get KYC queue error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch KYC queue",
    };
  }
}

/**
 * Alias for getPendingKYC - for backward compatibility
 */
export async function getPendingKYC(adminId: string, filters: any) {
  return getKYCQueue(adminId, {
    ...filters,
    status: filters.status || "pending",
  });
}

/**
 * Get detailed KYC application
 * Permission: KYC_VIEW
 */
export async function getKYCDetails(
  adminId: string,
  kycId: string
): Promise<{
  success: boolean;
  data?: {
    kyc: any;
    user: any;
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyKYCPermission(adminId, PERMISSIONS.KYC_VIEW);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const kyc = await KYC.findById(kycId)
      .populate("userId", "firstName lastName email phone")
      .lean();

    if (!kyc) {
      return { success: false, error: "KYC application not found" };
    }

    const user = await User.findById(kyc.userId)
      .select("-password -mfaSecret -mfaBackupCodes")
      .lean();

    return {
      success: true,
      data: {
        kyc,
        user,
      },
    };
  } catch (error: any) {
    console.error("Get KYC details error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch KYC details",
    };
  }
}

// =============================================================================
// KYC STATISTICS
// =============================================================================

/**
 * Get KYC statistics for dashboard
 * Permission: KYC_VIEW
 */
export async function getKYCStats(adminId: string): Promise<{
  success: boolean;
  data?: {
    totalApplications: number;
    pending: number;
    verified: number;
    rejected: number;
    processingToday: number;
    averageProcessingTime: number; // in hours
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyKYCPermission(adminId, PERMISSIONS.KYC_VIEW);
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalApplications,
      pending,
      verified,
      rejected,
      processingToday,
      recentVerified,
    ] = await Promise.all([
      KYC.countDocuments(),
      KYC.countDocuments({ status: { $in: ["pending", "submitted"] } }),
      KYC.countDocuments({ status: "verified" }),
      KYC.countDocuments({ status: "rejected" }),
      KYC.countDocuments({
        $or: [
          { verifiedAt: { $gte: todayStart } },
          { rejectedAt: { $gte: todayStart } },
        ],
      }),
      KYC.find({
        status: "verified",
        verifiedAt: { $exists: true },
        submittedAt: { $exists: true },
      })
        .select("submittedAt verifiedAt")
        .limit(100)
        .lean(),
    ]);

    // Calculate average processing time
    let averageProcessingTime = 0;
    if (recentVerified.length > 0) {
      const totalTime = recentVerified.reduce((sum, kyc) => {
        if (kyc.submittedAt && kyc.verifiedAt) {
          return sum + (kyc.verifiedAt.getTime() - kyc.submittedAt.getTime());
        }
        return sum;
      }, 0);
      averageProcessingTime =
        totalTime / recentVerified.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      success: true,
      data: {
        totalApplications,
        pending,
        verified,
        rejected,
        processingToday,
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
      },
    };
  } catch (error: any) {
    console.error("Get KYC stats error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch KYC statistics",
    };
  }
}

// =============================================================================
// KYC APPROVAL & REJECTION
// =============================================================================

/**
 * Approve KYC application
 * Permission: KYC_APPROVE
 */
export async function approveKYC(
  adminId: string,
  data: z.infer<typeof kycApprovalSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = kycApprovalSchema.parse(data);

    const permCheck = await verifyKYCPermission(
      adminId,
      PERMISSIONS.KYC_APPROVE
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get KYC application
    const kyc = await KYC.findById(validated.kycId);
    if (!kyc) {
      return { success: false, error: "KYC application not found" };
    }

    // Check if already processed
    if (kyc.status === "verified") {
      return { success: false, error: "KYC already verified" };
    }

    // Get user
    const user = await User.findById(kyc.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update KYC status
    kyc.status = "verified";
    kyc.verifiedAt = new Date();
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminId;
    kyc.reviewNotes = validated.reviewNotes;
    await kyc.save();

    // Update user KYC status
    user.kycStatus = "verified";
    user.kycVerifiedAt = new Date();
    await user.save();

    // Send approval email
    try {
      await sendEmail({
        to: user.email,
        subject: "KYC Verification Approved - GALLA.GOLD",
        html: `
          <h2>KYC Verification Approved</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your KYC verification has been approved. You now have full access to all trading features.</p>
          <p>Thank you for completing the verification process.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send KYC approval email:", emailError);
      // Don't fail the approval if email fails
    }

    // Audit log
    await auditKYCAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "approve",
      kycId: validated.kycId,
      userId: user._id.toString(),
      userEmail: user.email,
      notes: validated.reviewNotes,
    });

    return {
      success: true,
      data: {
        message: `KYC approved for ${user.email}`,
        kyc: {
          id: kyc._id,
          status: kyc.status,
          verifiedAt: kyc.verifiedAt,
        },
      },
    };
  } catch (error: any) {
    console.error("Approve KYC error:", error);
    return {
      success: false,
      error: error.message || "Failed to approve KYC",
    };
  }
}

/**
 * Reject KYC application
 * Permission: KYC_REJECT
 */
export async function rejectKYC(
  adminId: string,
  data: z.infer<typeof kycRejectionSchema>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const validated = kycRejectionSchema.parse(data);

    const permCheck = await verifyKYCPermission(
      adminId,
      PERMISSIONS.KYC_REJECT
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    // Get KYC application
    const kyc = await KYC.findById(validated.kycId);
    if (!kyc) {
      return { success: false, error: "KYC application not found" };
    }

    // Check if already processed
    if (kyc.status === "rejected") {
      return { success: false, error: "KYC already rejected" };
    }

    // Get user
    const user = await User.findById(kyc.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Update KYC status
    kyc.status = "rejected";
    kyc.rejectedAt = new Date();
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = adminId;
    kyc.rejectionReason = validated.rejectionReason;
    kyc.reviewNotes = validated.reviewNotes;
    await kyc.save();

    // Update user KYC status
    user.kycStatus = "rejected";
    user.kycRejectionReason = validated.rejectionReason;
    await user.save();

    // Send rejection email
    try {
      await sendEmail({
        to: user.email,
        subject: "KYC Verification Status Update - GALLA.GOLD",
        html: `
          <h2>KYC Verification Update</h2>
          <p>Dear ${user.firstName},</p>
          <p>We've reviewed your KYC submission and unfortunately cannot verify your account at this time.</p>
          <p><strong>Reason:</strong> ${validated.rejectionReason}</p>
          <p>You may submit a new KYC application with corrected documents.</p>
          <p>If you have questions, please contact our support team.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send KYC rejection email:", emailError);
    }

    // Audit log
    await auditKYCAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "reject",
      kycId: validated.kycId,
      userId: user._id.toString(),
      userEmail: user.email,
      reason: validated.rejectionReason,
      notes: validated.reviewNotes,
    });

    return {
      success: true,
      data: {
        message: `KYC rejected for ${user.email}`,
        kyc: {
          id: kyc._id,
          status: kyc.status,
          rejectedAt: kyc.rejectedAt,
        },
      },
    };
  } catch (error: any) {
    console.error("Reject KYC error:", error);
    return {
      success: false,
      error: error.message || "Failed to reject KYC",
    };
  }
}

/**
 * Request additional documents from user
 * Permission: KYC_REQUEST_DOCUMENTS
 */
export async function requestKYCDocuments(
  adminId: string,
  kycId: string,
  documentsNeeded: string[],
  notes?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const permCheck = await verifyKYCPermission(
      adminId,
      PERMISSIONS.KYC_REQUEST_DOCUMENTS
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    await dbConnect();

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
      return { success: false, error: "KYC application not found" };
    }

    const user = await User.findById(kyc.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Send email to user
    try {
      await sendEmail({
        to: user.email,
        subject: "Additional Documents Required - GALLA.GOLD KYC",
        html: `
          <h2>Additional Documents Needed</h2>
          <p>Dear ${user.firstName},</p>
          <p>We're reviewing your KYC application and need additional documents:</p>
          <ul>
            ${documentsNeeded.map((doc) => `<li>${doc}</li>`).join("")}
          </ul>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
          <p>Please upload the requested documents in your account dashboard.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send document request email:", emailError);
    }

    // Audit log
    await auditKYCAction({
      adminId,
      adminEmail: permCheck.admin!.email,
      adminRole: permCheck.admin!.role,
      action: "request_documents",
      kycId,
      userId: user._id.toString(),
      userEmail: user.email,
      notes: `Requested documents: ${documentsNeeded.join(", ")}`,
    });

    return {
      success: true,
      data: {
        message: `Document request sent to ${user.email}`,
      },
    };
  } catch (error: any) {
    console.error("Request KYC documents error:", error);
    return {
      success: false,
      error: error.message || "Failed to request documents",
    };
  }
}

/**
 * Bulk approve KYC applications
 * Permission: KYC_APPROVE
 */
export async function bulkApproveKYC(
  adminId: string,
  kycIds: string[],
  reviewNotes?: string
): Promise<{
  success: boolean;
  data?: {
    approved: number;
    failed: number;
    errors: string[];
  };
  error?: string;
}> {
  try {
    const permCheck = await verifyKYCPermission(
      adminId,
      PERMISSIONS.KYC_APPROVE
    );
    if (!permCheck.success) {
      return { success: false, error: permCheck.error };
    }

    if (kycIds.length === 0) {
      return { success: false, error: "No KYC IDs provided" };
    }

    if (kycIds.length > 50) {
      return {
        success: false,
        error: "Maximum 50 applications can be processed at once",
      };
    }

    let approved = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each KYC application
    for (const kycId of kycIds) {
      const result = await approveKYC(adminId, { kycId, reviewNotes });
      if (result.success) {
        approved++;
      } else {
        failed++;
        errors.push(`${kycId}: ${result.error}`);
      }
    }

    return {
      success: true,
      data: {
        approved,
        failed,
        errors,
      },
    };
  } catch (error: any) {
    console.error("Bulk approve KYC error:", error);
    return {
      success: false,
      error: error.message || "Failed to bulk approve KYC",
    };
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
  getKYCQueue,
  getKYCDetails,
  getKYCStats,
  approveKYC,
  rejectKYC,
  requestKYCDocuments,
  bulkApproveKYC,
};
