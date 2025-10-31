// /server/models/KYC.ts
// KYC (Know Your Customer) Model for GALLA.GOLD Application
// Purpose: Store and manage user verification documents and KYC status
// Includes document upload tracking, verification workflow, and compliance audit trail

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Document types for KYC verification
 */
export type DocumentType =
  | 'passport'
  | 'national_id'
  | 'drivers_license'
  | 'proof_of_address'
  | 'selfie';

/**
 * KYC verification status
 */
export type KYCStatus =
  | 'pending'      // Not started
  | 'submitted'    // Documents submitted, awaiting review
  | 'under_review' // Being reviewed by compliance team
  | 'verified'     // Approved and verified
  | 'rejected'     // Rejected, needs resubmission
  | 'expired';     // Verification expired, needs renewal

/**
 * Document information subdocument
 */
export interface IDocument {
  type: DocumentType;
  documentType: DocumentType;  // ✅ Add this (alias for backward compat)
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'pending' | 'approved' | 'rejected';  // ✅ Add this
  rejectionReason?: string;
}

/**
 * Personal information for KYC
 */
export interface IPersonalInfo {
  fullName: string;
  dateOfBirth: Date;
  nationality: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phoneNumber?: string;
}

/**
 * KYC document interface
 */
export interface IKYC extends Document {
  userId: Types.ObjectId; // Reference to User model
  
  // KYC status
  status: KYCStatus;
  
  // Personal information
  personalInfo: IPersonalInfo;
  
  // Uploaded documents
  documents: IDocument[];
  
  // Identity document details
  idType: 'passport' | 'national_id' | 'drivers_license';
  idNumber: string;
  idIssueDate?: Date;
  idExpiryDate?: Date;
  idIssuingCountry: string;
  
  // Verification details
  submittedAt?: Date;
  reviewedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date; // KYC expiration (typically 1 year)
  
  // Review information
  reviewedBy?: string; // Admin user ID
  reviewNotes?: string;
  rejectionReason?: string;
  
  // Risk assessment
  riskLevel?: 'low' | 'medium' | 'high';
  riskNotes?: string;
  
  // Compliance flags
  requiresManualReview: boolean;
  flaggedForReview: boolean;
  flagReason?: string;
  
  // Audit trail
  statusHistory: {
    status: KYCStatus;
    timestamp: Date;
    updatedBy?: string;
    note?: string;
  }[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addDocument(doc: Partial<IDocument>): Promise<void>;
  removeDocument(documentType: DocumentType): Promise<void>;
  submit(): Promise<void>;
  approve(reviewerId: string, notes?: string): Promise<void>;
  reject(reviewerId: string, reason: string): Promise<void>;
  addStatusUpdate(status: KYCStatus, note?: string, updatedBy?: string): Promise<void>;
  isExpired(): boolean;
  needsRenewal(): boolean;
}

/**
 * KYC model interface with static methods
 */
export interface IKYCModel extends Model<IKYC> {
  findByUserId(userId: string | Types.ObjectId): Promise<IKYC | null>;
  findPendingReviews(): Promise<IKYC[]>;
  findExpiring(daysUntilExpiry: number): Promise<IKYC[]>;
}

// =============================================================================
// SUBDOCUMENT SCHEMAS
// =============================================================================

/**
 * Document subdocument schema
 */
const DocumentSchema = new Schema<IDocument>(
  {
    type: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license', 'proof_of_address', 'selfie'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    verifiedBy: String,
    rejectionReason: String,
  },
  { _id: false }
);

/**
 * Personal information subdocument schema
 */
const PersonalInfoSchema = new Schema<IPersonalInfo>(
  {
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    phoneNumber: String,
  },
  { _id: false }
);

/**
 * Status history subdocument schema
 */
const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'verified', 'rejected', 'expired'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: String,
    note: String,
  },
  { _id: false }
);

// =============================================================================
// MAIN SCHEMA DEFINITION
// =============================================================================

const KYCSchema = new Schema<IKYC, IKYCModel>(
  {
    // -------------------------------------------------------------------------
    // USER REFERENCE
    // -------------------------------------------------------------------------
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One KYC record per user
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // KYC STATUS
    // -------------------------------------------------------------------------
    status: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'verified', 'rejected', 'expired'],
      default: 'pending',
      required: true,
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // PERSONAL INFORMATION
    // -------------------------------------------------------------------------
    personalInfo: {
      type: PersonalInfoSchema,
      required: true,
    },
    
    // -------------------------------------------------------------------------
    // UPLOADED DOCUMENTS
    // -------------------------------------------------------------------------
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    
    // -------------------------------------------------------------------------
    // IDENTITY DOCUMENT DETAILS
    // -------------------------------------------------------------------------
    idType: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license'],
      required: true,
    },
    
    idNumber: {
      type: String,
      required: true,
    },
    
    idIssueDate: Date,
    idExpiryDate: Date,
    
    idIssuingCountry: {
      type: String,
      required: true,
    },
    
    // -------------------------------------------------------------------------
    // VERIFICATION DETAILS
    // -------------------------------------------------------------------------
    submittedAt: Date,
    reviewedAt: Date,
    verifiedAt: Date,
    rejectedAt: Date,
    
    expiresAt: {
      type: Date,
      index: true,
    },
    
    // -------------------------------------------------------------------------
    // REVIEW INFORMATION
    // -------------------------------------------------------------------------
    reviewedBy: String,
    reviewNotes: String,
    rejectionReason: String,
    
    // -------------------------------------------------------------------------
    // RISK ASSESSMENT
    // -------------------------------------------------------------------------
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    
    riskNotes: String,
    
    // -------------------------------------------------------------------------
    // COMPLIANCE FLAGS
    // -------------------------------------------------------------------------
    requiresManualReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    flaggedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    flagReason: String,
    
    // -------------------------------------------------------------------------
    // AUDIT TRAIL
    // -------------------------------------------------------------------------
    statusHistory: {
      type: [StatusHistorySchema],
      default: function(this: IKYC) {
        return [{
          status: this.status || 'pending',
          timestamp: new Date(),
        }];
      },
    },
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// INDEXES FOR PERFORMANCE
// =============================================================================

KYCSchema.index({ userId: 1 });
KYCSchema.index({ status: 1 });
KYCSchema.index({ expiresAt: 1 });
KYCSchema.index({ requiresManualReview: 1, flaggedForReview: 1 });

// =============================================================================
// INSTANCE METHODS
// =============================================================================

/**
 * Add a document to KYC submission
 * @param doc - Document information
 */
KYCSchema.methods.addDocument = async function (doc: Partial<IDocument>): Promise<void> {
  // Remove existing document of same type
  this.documents = this.documents.filter((d: IDocument) => d.type !== doc.type);
  
  // Add new document
  this.documents.push({
    ...doc,
    uploadedAt: new Date(),
    verified: false,
  } as IDocument);
  
  await this.save();
};

/**
 * Remove a document from KYC submission
 * @param documentType - Type of document to remove
 */
KYCSchema.methods.removeDocument = async function (documentType: DocumentType): Promise<void> {
  this.documents = this.documents.filter((d: IDocument) => d.type !== documentType);
  await this.save();
};

/**
 * Submit KYC for review
 */
KYCSchema.methods.submit = async function (): Promise<void> {
  this.status = 'submitted';
  this.submittedAt = new Date();
  await this.addStatusUpdate('submitted', 'KYC submitted for review');
  await this.save();
};

/**
 * Approve KYC verification
 * @param reviewerId - Admin user ID
 * @param notes - Optional review notes
 */
KYCSchema.methods.approve = async function (reviewerId: string, notes?: string): Promise<void> {
  this.status = 'verified';
  this.verifiedAt = new Date();
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  this.reviewNotes = notes;
  
  // Set expiration to 1 year from now
  this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  
  await this.addStatusUpdate('verified', notes, reviewerId);
  await this.save();
};

/**
 * Reject KYC verification
 * @param reviewerId - Admin user ID
 * @param reason - Rejection reason
 */
KYCSchema.methods.reject = async function (reviewerId: string, reason: string): Promise<void> {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  this.rejectionReason = reason;
  
  await this.addStatusUpdate('rejected', reason, reviewerId);
  await this.save();
};

/**
 * Add status update to history
 * @param status - New status
 * @param note - Optional note
 * @param updatedBy - Optional user ID
 */
KYCSchema.methods.addStatusUpdate = async function (
  status: KYCStatus,
  note?: string,
  updatedBy?: string
): Promise<void> {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy,
  });
};

/**
 * Check if KYC is expired
 * @returns boolean
 */
KYCSchema.methods.isExpired = function (): boolean {
  return !!(this.expiresAt && this.expiresAt < new Date());
};

/**
 * Check if KYC needs renewal (30 days before expiry)
 * @returns boolean
 */
KYCSchema.methods.needsRenewal = function (): boolean {
  if (!this.expiresAt) return false;
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.expiresAt < thirtyDaysFromNow;
};

// =============================================================================
// STATIC METHODS
// =============================================================================

/**
 * Find KYC by user ID
 * @param userId - User ID
 * @returns Promise<IKYC | null>
 */
KYCSchema.statics.findByUserId = function (userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

/**
 * Find KYC submissions pending review
 * @returns Promise<IKYC[]>
 */
KYCSchema.statics.findPendingReviews = function () {
  return this.find({
    $or: [
      { status: 'submitted' },
      { status: 'under_review' },
    ],
  }).sort({ submittedAt: 1 });
};

/**
 * Find KYC records expiring soon
 * @param daysUntilExpiry - Number of days until expiry
 * @returns Promise<IKYC[]>
 */
KYCSchema.statics.findExpiring = function (daysUntilExpiry: number = 30) {
  const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'verified',
    expiresAt: { $lte: expiryDate, $gte: new Date() },
  }).sort({ expiresAt: 1 });
};

// =============================================================================
// MODEL EXPORT
// =============================================================================

const KYC = (mongoose.models.KYC as IKYCModel) ||
            mongoose.model<IKYC, IKYCModel>('KYC', KYCSchema);

export default KYC;

// =============================================================================
// USAGE EXAMPLES FOR DEVELOPERS
// =============================================================================

/*
 * CREATE KYC RECORD:
 * 
 * const kyc = await KYC.create({
 *   userId: user._id,
 *   personalInfo: {
 *     fullName: 'John Doe',
 *     dateOfBirth: new Date('1990-01-01'),
 *     nationality: 'US',
 *     addressLine1: '123 Main St',
 *     city: 'New York',
 *     country: 'USA',
 *     postalCode: '10001',
 *   },
 *   idType: 'passport',
 *   idNumber: 'AB123456',
 *   idIssuingCountry: 'USA',
 * });
 * 
 * 
 * ADD DOCUMENTS:
 * 
 * await kyc.addDocument({
 *   type: 'passport',
 *   fileUrl: 'https://storage.example.com/passport.jpg',
 *   fileName: 'passport.jpg',
 *   fileSize: 1024000,
 *   mimeType: 'image/jpeg',
 * });
 * 
 * 
 * SUBMIT FOR REVIEW:
 * 
 * await kyc.submit();
 * 
 * 
 * APPROVE KYC:
 * 
 * await kyc.approve(adminId, 'All documents verified');
 * 
 * 
 * CHECK STATUS:
 * 
 * const needsRenewal = kyc.needsRenewal();
 * const isExpired = kyc.isExpired();
 */
