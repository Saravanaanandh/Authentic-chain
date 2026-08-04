import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRetrainingLog extends Document {
  startTime: Date;
  endTime: Date;
  recordsUsed: number;
  feedbackRecordsUsed: number;
  newAccuracy: number;
  oldAccuracy: number;
  deploymentDecision: "PROMOTED" | "SKIPPED" | "FAILED";
  version?: string;
  durationSeconds?: number;
  metrics?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RetrainingLogSchema = new Schema<IRetrainingLog>(
  {
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    recordsUsed: { type: Number, required: true },
    feedbackRecordsUsed: { type: Number, required: true },
    newAccuracy: { type: Number, required: true },
    oldAccuracy: { type: Number, required: true },
    deploymentDecision: {
      type: String,
      enum: ["PROMOTED", "SKIPPED", "FAILED"],
      required: true,
      index: true,
    },
    version: { type: String },
    durationSeconds: { type: Number },
    metrics: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  {
    timestamps: true,
    collection: "retraining_logs",
  }
);

const RetrainingLog: Model<IRetrainingLog> =
  mongoose.models.RetrainingLog ||
  mongoose.model<IRetrainingLog>("RetrainingLog", RetrainingLogSchema);

export default RetrainingLog;
