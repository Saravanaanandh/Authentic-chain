import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModelFeedback extends Document {
  username: string;
  sourcePlatform: string;
  originalPrediction: string;
  originalFakeProbability: number;
  userCorrectedLabel: string;
  isCorrect?: boolean;
  feedbackReason: string;
  notes?: string;
  profileSnapshot?: any;
  submittedBy?: string;
  source: string;
  verified: boolean;
  reviewed?: boolean;
  approvedForTraining?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModelFeedbackSchema = new Schema<IModelFeedback>(
  {
    username: { type: String, required: true, index: true },
    sourcePlatform: { type: String, default: "instagram" },
    originalPrediction: { type: String, required: true },
    originalFakeProbability: { type: Number, required: true },
    userCorrectedLabel: { type: String, required: true },
    isCorrect: { type: Boolean },
    feedbackReason: { type: String, required: true },
    notes: { type: String, default: "" },
    profileSnapshot: { type: Schema.Types.Mixed },
    submittedBy: { type: String, default: "anonymous" },
    source: { type: String, default: "user_feedback" },
    verified: { type: Boolean, default: true },
    reviewed: { type: Boolean, default: false },
    approvedForTraining: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "feedback_data",
  }
);

const ModelFeedback: Model<IModelFeedback> =
  mongoose.models.ModelFeedback ||
  mongoose.model<IModelFeedback>("ModelFeedback", ModelFeedbackSchema);

export default ModelFeedback;
