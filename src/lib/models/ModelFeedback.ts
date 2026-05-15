import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModelFeedback extends Document {
  username: string;
  sourcePlatform: string;
  originalPrediction: string;
  originalFakeProbability: number;
  userCorrectedLabel: "Real" | "Fake" | "Suspicious";
  feedbackReason: string;
  notes?: string;
  profileSnapshot?: any;
  submittedAt: Date;
  reviewed: boolean;
  approvedForTraining: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  submittedBy?: string; // user email or "anonymous"
}

const ModelFeedbackSchema = new Schema<IModelFeedback>(
  {
    username: { type: String, required: true, index: true },
    sourcePlatform: { type: String, default: "instagram" },
    originalPrediction: { type: String, required: true },
    originalFakeProbability: { type: Number, required: true },
    userCorrectedLabel: {
      type: String,
      enum: ["Real", "Fake", "Suspicious"],
      required: true,
    },
    feedbackReason: { type: String, required: true },
    notes: { type: String, default: "" },
    profileSnapshot: { type: Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false },
    approvedForTraining: { type: Boolean, default: false },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    submittedBy: { type: String, default: "anonymous" },
  },
  {
    timestamps: true,
    collection: "model_feedback",
  }
);

const ModelFeedback: Model<IModelFeedback> =
  mongoose.models.ModelFeedback ||
  mongoose.model<IModelFeedback>("ModelFeedback", ModelFeedbackSchema);

export default ModelFeedback;
