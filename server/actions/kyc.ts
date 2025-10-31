// /server/actions/kyc.ts
// KYC verification server actions
// Handles identity verification document submission and status checks

"use server";

import { requireAuth } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import User from "@/server/models/User";
import KYC from "@/server/models/KYC";
import {
  kycSubmissionSchema,
  kycDocumentSchema,
} from "@/server/lib/validation";
import { sendEmail } from "@/server/email/send";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// ============================================================================
// GET KYC STATUS ACTION
// ============================================================================

/**
 * Get user's current KYC verification status
 * @returns ActionResponse with KYC status and details
 */
export async function getKYCStatusAction(): Promise<
  ActionResponse<{
    status: "none" | "pending" | "verified" | "rejected";
    submittedAt?: Date;
    reviewedAt?: Date;
    rejectionReason?: string;
    documents?: Array<{
      type: string;
      status: string;
      uploadedAt: Date;
    }>;
  }>
> {
  try {
    const session = await requireAuth();
    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // If no KYC submitted
    if (user.kycStatus === "none") {
      return {
        success: true,
        data: {
          status: "none",
        },
      };
    }

    // Get KYC details
    const kyc = await KYC.findOne({ userId: session.user.id })
      .sort({ submittedAt: -1 }) // Get most recent submission
      .lean();

    if (!kyc) {
      return {
        success: true,
        data: {
          status: user.kycStatus,
        },
      };
    }

    return {
      success: true,
      data: {
        status: user.kycStatus,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        rejectionReason: kyc.rejectionReason,
        documents: kyc.documents.map((doc) => ({
          type: doc.documentType,
          status: doc.status,
          uploadedAt: doc.uploadedAt,
        })),
      },
    };
  } catch (error: any) {
    console.error("Get KYC status error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch KYC status",
    };
  }
}

// ============================================================================
// SUBMIT KYC ACTION
// ============================================================================

/**
 * Submit KYC verification documents
 * @param formData - KYC submission form data
 * @returns ActionResponse with submission confirmation
 * 
 * Process:
 * 1. Validate all documents
 * 2. Create KYC record
 * 3. Update user KYC status to "pending"
 * 4. Send confirmation email
 * 5. Notify admin team (in production)
 */
export async function submitKYCAction(
  formData: FormData
): Promise<ActionResponse<{ kycId: string }>> {
  try {
    const session = await requireAuth();

    // Extract and validate data
    const documents = JSON.parse(formData.get("documents") as string);

    const rawData = {
      fullName: formData.get("fullName"),
      dateOfBirth: formData.get("dateOfBirth"),
      nationality: formData.get("nationality"),
      occupation: formData.get("occupation"),
      sourceOfFunds: formData.get("sourceOfFunds"),
      documents,
    };

    const validated = kycSubmissionSchema.parse(rawData);

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if already verified
    if (user.kycStatus === "verified") {
      return {
        success: false,
        error: "Your identity is already verified",
      };
    }

    // Check if submission is pending
    if (user.kycStatus === "pending") {
      return {
        success: false,
        error: "You already have a pending KYC submission under review",
      };
    }

    // Create KYC record
    const kyc = await KYC.create({
      userId: session.user.id,
      fullName: validated.fullName,
      dateOfBirth: new Date(validated.dateOfBirth),
      nationality: validated.nationality,
      occupation: validated.occupation,
      sourceOfFunds: validated.sourceOfFunds,
      documents: validated.documents.map((doc) => ({
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
        frontImageUrl: doc.frontImage,
        backImageUrl: doc.backImage,
        status: "pending",
        uploadedAt: new Date(),
      })),
      status: "pending",
      submittedAt: new Date(),
    });

    // Update user KYC status
    user.kycStatus = "pending";
    await user.save();

    // Send confirmation email to user
    await sendEmail({
      to: user.email,
      subject: "KYC Verification Submitted - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "KYC Verification",
        amount: "Documents submitted",
        date: new Date().toLocaleDateString(),
        transactionId: kyc._id.toString(),
        status: "pending",
      },
    });

    // TODO: In production, notify admin team for review
    // Could send email to admin panel or create notification in admin dashboard

    return {
      success: true,
      message: "KYC verification submitted successfully! We'll review your documents within 2-3 business days.",
      data: {
        kycId: kyc._id.toString(),
      },
    };
  } catch (error: any) {
    console.error("Submit KYC error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to submit KYC verification",
    };
  }
}

// ============================================================================
// RESUBMIT KYC ACTION
// ============================================================================

/**
 * Resubmit KYC verification after rejection
 * @param formData - KYC resubmission form data
 * @returns ActionResponse with resubmission confirmation
 * 
 * Allows users to resubmit after rejection with corrected documents
 */
export async function resubmitKYCAction(
  formData: FormData
): Promise<ActionResponse<{ kycId: string }>> {
  try {
    const session = await requireAuth();
    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if previous submission was rejected
    if (user.kycStatus !== "rejected") {
      return {
        success: false,
        error: "You can only resubmit KYC after a rejection",
      };
    }

    // Extract and validate data (same as submit)
    const documents = JSON.parse(formData.get("documents") as string);

    const rawData = {
      fullName: formData.get("fullName"),
      dateOfBirth: formData.get("dateOfBirth"),
      nationality: formData.get("nationality"),
      occupation: formData.get("occupation"),
      sourceOfFunds: formData.get("sourceOfFunds"),
      documents,
    };

    const validated = kycSubmissionSchema.parse(rawData);

    // Create new KYC record
    const kyc = await KYC.create({
      userId: session.user.id,
      fullName: validated.fullName,
      dateOfBirth: new Date(validated.dateOfBirth),
      nationality: validated.nationality,
      occupation: validated.occupation,
      sourceOfFunds: validated.sourceOfFunds,
      documents: validated.documents.map((doc) => ({
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
        frontImageUrl: doc.frontImage,
        backImageUrl: doc.backImage,
        status: "pending",
        uploadedAt: new Date(),
      })),
      status: "pending",
      submittedAt: new Date(),
    });

    // Update user KYC status back to pending
    user.kycStatus = "pending";
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "KYC Verification Resubmitted - Galla Gold",
      template: "transaction",
      data: {
        firstName: user.firstName,
        type: "KYC Resubmission",
        amount: "Documents resubmitted",
        date: new Date().toLocaleDateString(),
        transactionId: kyc._id.toString(),
        status: "pending",
      },
    });

    return {
      success: true,
      message: "KYC verification resubmitted successfully! We'll review your documents within 2-3 business days.",
      data: {
        kycId: kyc._id.toString(),
      },
    };
  } catch (error: any) {
    console.error("Resubmit KYC error:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to resubmit KYC verification",
    };
  }
}

// ============================================================================
// ADMIN: APPROVE KYC ACTION
// ============================================================================

/**
 * Approve a user's KYC verification (ADMIN ONLY)
 * @param userId - User ID to approve
 * @returns ActionResponse with approval confirmation
 * 
 * Note: This should be called from an admin panel with proper authorization
 */
export async function approveKYCAction(
  userId: string
): Promise<ActionResponse> {
  try {
    // TODO: In production, verify admin role
    // const session = await requireRole("admin");

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Find pending KYC
    const kyc = await KYC.findOne({
      userId,
      status: "pending",
    }).sort({ submittedAt: -1 });

    if (!kyc) {
      return {
        success: false,
        error: "No pending KYC found for this user",
      };
    }

    // Update KYC status
    kyc.status = "approved";
    kyc.reviewedAt = new Date();
    kyc.documents.forEach((doc) => {
      doc.status = "approved";
    });
    await kyc.save();

    // Update user KYC status
    user.kycStatus = "verified";
    await user.save();

    // Increase transaction limits for verified users
    const wallet = await user.populate("wallet");
    if (wallet) {
      // TODO: Update wallet limits in Wallet model
      // Example: Increase limits by 10x for verified users
    }

    // Send approval email
    await sendEmail({
      to: user.email,
      subject: "KYC Verification Approved - Galla Gold",
      template: "kyc-approved",
      data: {
        firstName: user.firstName,
      },
    });

    return {
      success: true,
      message: "KYC verification approved successfully",
    };
  } catch (error: any) {
    console.error("Approve KYC error:", error);

    return {
      success: false,
      error: error.message || "Failed to approve KYC verification",
    };
  }
}

// ============================================================================
// ADMIN: REJECT KYC ACTION
// ============================================================================

/**
 * Reject a user's KYC verification (ADMIN ONLY)
 * @param userId - User ID to reject
 * @param reason - Rejection reason
 * @returns ActionResponse with rejection confirmation
 * 
 * Note: This should be called from an admin panel with proper authorization
 */
export async function rejectKYCAction(
  userId: string,
  reason: string
): Promise<ActionResponse> {
  try {
    // TODO: In production, verify admin role
    // const session = await requireRole("admin");

    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        error: "Rejection reason must be at least 10 characters",
      };
    }

    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Find pending KYC
    const kyc = await KYC.findOne({
      userId,
      status: "pending",
    }).sort({ submittedAt: -1 });

    if (!kyc) {
      return {
        success: false,
        error: "No pending KYC found for this user",
      };
    }

    // Update KYC status
    kyc.status = "rejected";
    kyc.reviewedAt = new Date();
    kyc.rejectionReason = reason;
    kyc.documents.forEach((doc) => {
      doc.status = "rejected";
    });
    await kyc.save();

    // Update user KYC status
    user.kycStatus = "rejected";
    await user.save();

    // Send rejection email
    await sendEmail({
      to: user.email,
      subject: "KYC Verification Review Required - Galla Gold",
      template: "kyc-rejected",
      data: {
        firstName: user.firstName,
        reason,
      },
    });

    return {
      success: true,
      message: "KYC verification rejected successfully",
    };
  } catch (error: any) {
    console.error("Reject KYC error:", error);

    return {
      success: false,
      error: error.message || "Failed to reject KYC verification",
    };
  }
}

// ============================================================================
// GET KYC REQUIREMENTS ACTION
// ============================================================================

/**
 * Get KYC requirements and guidelines
 * @returns ActionResponse with requirements
 */
export async function getKYCRequirementsAction(): Promise<
  ActionResponse<{
    requiredDocuments: string[];
    acceptedDocuments: Array<{
      type: string;
      description: string;
      requirements: string[];
    }>;
    guidelines: string[];
  }>
> {
  try {
    return {
      success: true,
      data: {
        requiredDocuments: [
          "Government-issued photo ID (passport, driver's license, or national ID)",
          "Proof of address (utility bill or bank statement less than 3 months old)",
        ],
        acceptedDocuments: [
          {
            type: "Passport",
            description: "Valid international passport",
            requirements: [
              "Must be valid (not expired)",
              "Clear photo of data page",
              "All text must be readable",
            ],
          },
          {
            type: "Driver's License",
            description: "Government-issued driver's license",
            requirements: [
              "Must be valid (not expired)",
              "Clear photos of front and back",
              "All text must be readable",
            ],
          },
          {
            type: "National ID",
            description: "Government-issued national identity card",
            requirements: [
              "Must be valid (not expired)",
              "Clear photos of front and back",
              "All text must be readable",
            ],
          },
          {
            type: "Utility Bill",
            description: "Recent utility bill (electricity, water, gas)",
            requirements: [
              "Must be less than 3 months old",
              "Must show your full name and address",
              "All text must be readable",
            ],
          },
          {
            type: "Bank Statement",
            description: "Recent bank statement",
            requirements: [
              "Must be less than 3 months old",
              "Must show your full name and address",
              "All text must be readable",
            ],
          },
        ],
        guidelines: [
          "All documents must be valid and not expired",
          "Images must be clear and all text readable",
          "Documents must be in color (not black and white)",
          "No screenshots - original documents only",
          "File size must be less than 10MB per document",
          "Accepted formats: JPG, PNG, PDF",
          "Review typically takes 2-3 business days",
        ],
      },
    };
  } catch (error: any) {
    console.error("Get KYC requirements error:", error);

    return {
      success: false,
      error: error.message || "Failed to fetch KYC requirements",
    };
  }
}
