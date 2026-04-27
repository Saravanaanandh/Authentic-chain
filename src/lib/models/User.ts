/* =====================================================
   Mongoose Model — User
   --------------------------------------------------------
   Stores application users including their role.
   ===================================================== */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  image?: string;
  role: "user" | "admin";
  authProvider: "credentials" | "google";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      // Not required for Google OAuth users
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    authProvider: {
      type: String,
      enum: ["credentials", "google"],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Avoid model recompilation in Next.js hot reloads
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
