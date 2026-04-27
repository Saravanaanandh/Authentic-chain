/* =====================================================
   Shared TypeScript types for the Fake Profile Detection
   System — used across frontend components and API routes.
   ===================================================== */

export interface ProfileInput {
  username: string;
  followers: number;
  posts: number;
  accountAge: string;           // e.g. "3 days", "2 years"
  bio: string;
  profileImage?: string;        // base64 or data-URL
}

export interface VerificationReason {
  rule: string;
  detail: string;
  riskAdded: number;
}

export type ProfileStatus = "REAL" | "SUSPICIOUS" | "FAKE";

export interface VerificationResult {
  id: string;
  username: string;
  riskScore: number;
  status: ProfileStatus;
  reasons: VerificationReason[];
  dataHash: string;
  imageHash: string;
  imageUrl: string;             // Cloudinary image URL
  blockchainTx: string;
  createdAt: string;
}

export interface StoredProfile {
  id: string;
  username: string;
  followers: number;
  posts: number;
  accountAge: string;
  bio: string;
  imageHash: string;
  imageUrl: string;             // Cloudinary secure URL
  imagePublicId: string;        // Cloudinary public ID
  dataHash: string;
  riskScore: number;
  result: ProfileStatus;
  blockchainTx: string;
  reasons: VerificationReason[];
  analyzedBy?: string[];
  createdAt: string;
}

export interface ImageComparisonResult {
  duplicate: boolean;
  matchedProfiles: { username: string; similarity: number }[];
}

export interface BlockchainRecord {
  txHash: string;
  dataHash: string;
  result: string;
  timestamp: number;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  description: string;
  uptime: number;
  database: string;
}
