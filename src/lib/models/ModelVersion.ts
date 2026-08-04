import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModelVersion extends Document {
  versionNumber: string;
  trainingDate: Date;
  trainingSampleCount: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  featureCount: number;
  trainingDuration: number;
  deploymentStatus: "ACTIVE" | "ARCHIVED";
  detailedMetrics?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ModelVersionSchema = new Schema<IModelVersion>(
  {
    versionNumber: { type: String, required: true, unique: true, index: true },
    trainingDate: { type: Date, default: Date.now, index: true },
    trainingSampleCount: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    precision: { type: Number, required: true },
    recall: { type: Number, required: true },
    f1Score: { type: Number, required: true },
    featureCount: { type: Number, default: 11 },
    trainingDuration: { type: Number, required: true },
    deploymentStatus: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    detailedMetrics: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: "model_versions",
  }
);

const ModelVersion: Model<IModelVersion> =
  mongoose.models.ModelVersion ||
  mongoose.model<IModelVersion>("ModelVersion", ModelVersionSchema);

export default ModelVersion;
