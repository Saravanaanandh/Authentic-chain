/* =====================================================
   Mongoose Model — InstagramAnalysis
   --------------------------------------------------------
   Stores every Instagram profile analysis, its risk
   assessment, and optional blockchain proof reference.
   ===================================================== */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstagramAnalysis extends Document {
  input: string;                // original user input
  username: string;             // extracted clean username
  profileData: {
    fullName: string;
    biography: string;
    followersCount: number;
    followsCount: number;
    postsCount: number;
    verified: boolean;
    profilePicUrl: string;
    isPrivate: boolean;
    externalUrl: string;
    instagramId: string;
  };
  analysis: {
    riskScore: number;
    fakeProbability: number;
    verdict: "REAL" | "SUSPICIOUS" | "HIGHLY FAKE";
    reasons: {
      signal: string;
      detail: string;
      weight: number;
    }[];
    tabularScore?: number;
    imageScore?: number;
    bioScore?: number;
    anomalyScore?: number;
  };
  externalAnalysis?: any;
  internalAnalysis?: any;
  hybridAnalysis?: any;
  sourcePlatform?: string;
  apifyRawData?: any;
  blockchainHash: string;
  blockchainTx: string;
  scannedBy: string;            // user email or "anonymous"
  createdAt: Date;
  updatedAt: Date;
}

const InstagramAnalysisSchema = new Schema<IInstagramAnalysis>(
  {
    input: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    profileData: {
      fullName: { type: String, default: "" },
      biography: { type: String, default: "" },
      followersCount: { type: Number, default: 0 },
      followsCount: { type: Number, default: 0 },
      postsCount: { type: Number, default: 0 },
      verified: { type: Boolean, default: false },
      profilePicUrl: { type: String, default: "" },
      isPrivate: { type: Boolean, default: false },
      externalUrl: { type: String, default: "" },
      instagramId: { type: String, default: "" },
    },
    analysis: {
      riskScore: { type: Number, required: true, min: 0, max: 100 },
      fakeProbability: { type: Number, required: true, min: 0, max: 100 },
      verdict: {
        type: String,
        enum: ["REAL", "SUSPICIOUS", "HIGHLY FAKE"],
        required: true,
        index: true,
      },
      reasons: [
        {
          signal: { type: String, required: true },
          detail: { type: String, required: true },
          weight: { type: Number, required: true },
        },
      ],
      tabularScore: { type: Number },
      imageScore: { type: Number },
      bioScore: { type: Number },
      anomalyScore: { type: Number },
    },
    externalAnalysis: { type: Schema.Types.Mixed },
    internalAnalysis: { type: Schema.Types.Mixed },
    hybridAnalysis: { type: Schema.Types.Mixed },
    sourcePlatform: { type: String, default: "instagram" },
    apifyRawData: { type: Schema.Types.Mixed },
    blockchainHash: {
      type: String,
      default: "",
    },
    blockchainTx: {
      type: String,
      default: "",
    },
    scannedBy: {
      type: String,
      default: "anonymous",
    },
  },
  {
    timestamps: true,
    collection: "instagram_analyses",
  }
);

// Avoid model recompilation during Next.js hot reloads
const InstagramAnalysis: Model<IInstagramAnalysis> =
  mongoose.models.InstagramAnalysis ||
  mongoose.model<IInstagramAnalysis>("InstagramAnalysis", InstagramAnalysisSchema);

export default InstagramAnalysis;
