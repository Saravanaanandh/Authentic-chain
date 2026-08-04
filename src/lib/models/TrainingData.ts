import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrainingData extends Document {
  "profile pic": number;
  "nums/length username": number;
  "fullname words": number;
  "nums/length fullname": number;
  "name==username": number;
  "description length": number;
  "external URL": number;
  private: number;
  "#posts": number;
  "#followers": number;
  "#follows": number;
  fake: number;
  username?: string;
  instagramId?: string;
  profileHash: string;
  source: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingDataSchema = new Schema<ITrainingData>(
  {
    "profile pic": { type: Number, required: true },
    "nums/length username": { type: Number, required: true },
    "fullname words": { type: Number, required: true },
    "nums/length fullname": { type: Number, required: true },
    "name==username": { type: Number, required: true },
    "description length": { type: Number, required: true },
    "external URL": { type: Number, required: true },
    private: { type: Number, required: true },
    "#posts": { type: Number, required: true },
    "#followers": { type: Number, required: true },
    "#follows": { type: Number, required: true },
    fake: { type: Number, required: true, index: true },
    username: { type: String },
    instagramId: { type: String },
    profileHash: { type: String, required: true, unique: true, index: true },
    source: { type: String, default: "dataset_csv" },
    verified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "training_data",
  }
);

const TrainingData: Model<ITrainingData> =
  mongoose.models.TrainingData ||
  mongoose.model<ITrainingData>("TrainingData", TrainingDataSchema);

export default TrainingData;
