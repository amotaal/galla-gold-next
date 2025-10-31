// server/models/KYC.ts
// ============================================================================
// KYC Model - FIXED
// ============================================================================
// Purpose: Know Your Customer verification and document management
// ✅ FIXED: Added _id typing
// ✅ FIXED: IDocument has documentType and status properties
// ✅ FIXED: KYCStatus includes "none" for compatibility

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type DocumentType =
  | 'passport'
  | 'national_id'
  | 'drivers_license'
  | 'proof_of_address'
  | 'selfie';

export type KYCStatus =
  | 'none'         // ✅ FIXED: Added for new users
  | 'pending'
  | 'submitted'    // ✅ FIXED: Must be included
  | 'verified'
  | 'rejected';

export interface IDocument {
  type: DocumentType;
  documentType: DocumentType;               // ✅ FIXED: Alias for compatibility
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'pending' | 'approved' | 'rejected';  // ✅ FIXED: Document-level status
  rejectionReason?: string;
}

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

export interface IKYC extends Document {
  _id: Types.ObjectId;              // ✅ FIXED: Explicit _id typing
  userId: Types.ObjectId;
  
  status: KYCStatus;
  personalInfo: IPersonalInfo;
  documents: IDocument[];
  
  idType: 'passport' | 'national_id' | 'drivers_license';
  idNumber: string;
  idIssueDate?: Date;
  idExpiryDate?: Date;
  idIssuingCountry: string;
  
  submittedAt?: Date;
  reviewedAt?: Date;
  verifiedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;
  
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  
  riskLevel?: 'low' | 'medium' | 'high';
  riskNotes?: string;
  
  requiresManualReview: boolean;
  flaggedForReview: boolean;
  flagReason?: string;
  
  statusHistory: {
    status: KYCStatus;
    timestamp: Date;
    updatedBy?: string;
    note?: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
  
  addDocument(doc: Partial<IDocument>): Promise<void>;
  removeDocument(documentType: DocumentType): Promise<void>;
  submit(): Promise<void>;
  approve(reviewerId: string, notes?: string): Promise<void>;
  reject(reviewerId: string, reason: string): Promise<void>;
  addStatusUpdate(status: KYCStatus, note?: string, updatedBy?: string): Promise<void>;
  isExpired(): boolean;
  needsRenewal(): boolean;
}

export interface IKYCModel extends Model<IKYC> {
  findByUserId(userId: string | Types.ObjectId): Promise<IKYC | null>;
  findPendingReviews(): Promise<IKYC[]>;
  findExpiring(daysUntilExpiry: number): Promise<IKYC[]>;
}

// =============================================================================
// SUBDOCUMENT SCHEMAS
// =============================================================================

const DocumentSchema = new Schema<IDocument>(
  {
    type: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license', 'proof_of_address', 'selfie'],
      required: true,
    },
    documentType: {                         // ✅ FIXED: Add documentType alias
      type: String,
      enum: ['passport', 'national_id', 'drivers_license', 'proof_of_address', 'selfie'],
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: String,
    status: {                               // ✅ FIXED: Document-level status
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
  },
  { _id: false }
);

// Auto-sync type and documentType
DocumentSchema.pre('save', function() {
  if (this.type && !this.documentType) {
    this.documentType = this.type;
  }
});

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

const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['none', 'pending', 'submitted', 'verified', 'rejected'],  // ✅ FIXED: Include all statuses
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: String,
    note: String,
  },
  { _id: false }
);

// =============================================================================
// MAIN SCHEMA
// =============================================================================

const KYCSchema = new Schema<IKYC, IKYCModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    
    status: {
      type: String,
      enum: ['none', 'pending', 'submitted', 'verified', 'rejected'],  // ✅ FIXED: All statuses
      default: 'pending',
    },
    
    personalInfo: { type: PersonalInfoSchema, required: true },
    documents: [DocumentSchema],
    
    idType: {
      type: String,
      enum: ['passport', 'national_id', 'drivers_license'],
      required: true,
    },
    idNumber: { type: String, required: true },
    idIssueDate: Date,
    idExpiryDate: Date,
    idIssuingCountry: { type: String, required: true },
    
    submittedAt: Date,
    reviewedAt: Date,
    verifiedAt: Date,
    rejectedAt: Date,
    expiresAt: Date,
    
    reviewedBy: String,
    reviewNotes: String,
    rejectionReason: String,
    
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    riskNotes: String,
    
    requiresManualReview: { type: Boolean, default: false },
    flaggedForReview: { type: Boolean, default: false },
    flagReason: String,
    
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
// INDEXES
// =============================================================================

KYCSchema.index({ userId: 1 });
KYCSchema.index({ status: 1 });
KYCSchema.index({ expiresAt: 1 });
KYCSchema.index({ requiresManualReview: 1, flaggedForReview: 1 });

// =============================================================================
// INSTANCE METHODS
// =============================================================================

KYCSchema.methods.addDocument = async function (doc: Partial<IDocument>): Promise<void> {
  this.documents = this.documents.filter((d: IDocument) => d.type !== doc.type);
  this.documents.push({
    ...doc,
    documentType: doc.type,               // ✅ FIXED: Set documentType
    uploadedAt: new Date(),
    verified: false,
    status: 'pending',
  } as IDocument);
  await this.save();
};

KYCSchema.methods.removeDocument = async function (documentType: DocumentType): Promise<void> {
  this.documents = this.documents.filter((d: IDocument) => d.type !== documentType);
  await this.save();
};

KYCSchema.methods.submit = async function (): Promise<void> {
  this.status = 'submitted';
  this.submittedAt = new Date();
  await this.addStatusUpdate('submitted', 'KYC submitted for review');
  await this.save();
};

KYCSchema.methods.approve = async function (reviewerId: string, notes?: string): Promise<void> {
  this.status = 'verified';              // ✅ Use 'verified', not 'approved'
  this.verifiedAt = new Date();
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  this.reviewNotes = notes;
  this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await this.addStatusUpdate('verified', notes, reviewerId);
  await this.save();
};

KYCSchema.methods.reject = async function (reviewerId: string, reason: string): Promise<void> {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.reviewedAt = new Date();
  this.reviewedBy = reviewerId;
  this.rejectionReason = reason;
  await this.addStatusUpdate('rejected', reason, reviewerId);
  await this.save();
};

KYCSchema.methods.addStatusUpdate = async function (
  status: KYCStatus,
  note?: string,
  updatedBy?: string
): Promise<void> {
  this.statusHistory.push({ status, timestamp: new Date(), note, updatedBy });
};

KYCSchema.methods.isExpired = function (): boolean {
  return !!(this.expiresAt && this.expiresAt < new Date());
};

KYCSchema.methods.needsRenewal = function (): boolean {
  if (!this.expiresAt) return false;
  const daysUntilExpiry = Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30;
};

// =============================================================================
// STATIC METHODS
// =============================================================================

KYCSchema.statics.findByUserId = function (userId: string | Types.ObjectId) {
  return this.findOne({ userId });
};

KYCSchema.statics.findPendingReviews = function () {
  return this.find({ status: 'submitted' });
};

KYCSchema.statics.findExpiring = function (daysUntilExpiry: number = 30) {
  const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'verified',
    expiresAt: { $lt: expiryDate, $gt: new Date() },
  });
};

// =============================================================================
// EXPORT
// =============================================================================

const KYC = (mongoose.models.KYC as IKYCModel) || mongoose.model<IKYC, IKYCModel>('KYC', KYCSchema);
export default KYC;
