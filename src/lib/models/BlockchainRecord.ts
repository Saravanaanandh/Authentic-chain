/* =====================================================
   Mongoose Model — BlockchainRecord
   --------------------------------------------------------
   Stores simulated blockchain proof records — each
   verification anchors a dataHash + result on the
   (simulated) chain.
   ===================================================== */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlockchainRecord extends Document {
  txHash: string;
  dataHash: string;
  result: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlockchainRecordSchema = new Schema<IBlockchainRecord>(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    dataHash: {
      type: String,
      required: true,
      index: true,
    },
    result: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "blockchain_records",
  }
);

// Avoid model recompilation in Next.js hot reloads
const BlockchainRecord: Model<IBlockchainRecord> =
  mongoose.models.BlockchainRecord ||
  mongoose.model<IBlockchainRecord>("BlockchainRecord", BlockchainRecordSchema);

export default BlockchainRecord;
