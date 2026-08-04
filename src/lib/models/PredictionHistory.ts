import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPredictionHistory extends Document {
  predictionId: string;
  username: string;
  profileFeatures: any;
  prediction: string;
  confidence: number;
  riskScore: number;
  modelsUsed: string[];
  predictionTimestamp: Date;
  blockchainHash: string;
  cloudinaryImageUrl: string;
  feedbackStatus: "pending" | "correct" | "incorrect";
  createdAt: Date;
  updatedAt: Date;
}

const PredictionHistorySchema = new Schema<IPredictionHistory>(
  {
    predictionId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, index: true },
    profileFeatures: { type: Schema.Types.Mixed, required: true },
    prediction: { type: String, required: true },
    confidence: { type: Number, required: true },
    riskScore: { type: Number, required: true },
    modelsUsed: [{ type: String }],
    predictionTimestamp: { type: Date, default: Date.now, index: true },
    blockchainHash: { type: String, default: "" },
    cloudinaryImageUrl: { type: String, default: "" },
    feedbackStatus: {
      type: String,
      enum: ["pending", "correct", "incorrect"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "prediction_history",
  }
);

const PredictionHistory: Model<IPredictionHistory> =
  mongoose.models.PredictionHistory ||
  mongoose.model<IPredictionHistory>("PredictionHistory", PredictionHistorySchema);

export default PredictionHistory;
