/* =====================================================
   Mongoose Model — Profile
   --------------------------------------------------------
   Stores every verified social media profile, its risk
   assessment, Cloudinary image URL, and blockchain proof
   reference.
   ===================================================== */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProfile extends Document {
  profileId: string;            // application-level UUID
  username: string;
  followers: number;
  posts: number;
  accountAge: string;
  bio: string;
  imageHash: string;
  imageUrl: string;             // Cloudinary secure_url
  imagePublicId: string;        // Cloudinary public_id
  dataHash: string;
  riskScore: number;
  result: "REAL" | "SUSPICIOUS" | "FAKE";
  blockchainTx: string;
  reasons: {
    rule: string;
    detail: string;
    riskAdded: number;
  }[];
  analyzedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    profileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    followers: {
      type: Number,
      default: 0,
      min: 0,
    },
    posts: {
      type: Number,
      default: 0,
      min: 0,
    },
    accountAge: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
    imageHash: {
      type: String,
      default: "",
      index: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    dataHash: {
      type: String,
      required: true,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    result: {
      type: String,
      enum: ["REAL", "SUSPICIOUS", "FAKE"],
      required: true,
      index: true,
    },
    blockchainTx: {
      type: String,
      required: true,
    },
    reasons: [
      {
        rule: { type: String, required: true },
        detail: { type: String, required: true },
        riskAdded: { type: Number, required: true },
      },
    ],
    analyzedBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,           // adds createdAt and updatedAt
    collection: "profiles",
  }
);

// Avoid model recompilation in Next.js hot reloads
const Profile: Model<IProfile> =
  mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;
