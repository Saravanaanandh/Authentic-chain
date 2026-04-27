/* =====================================================
   MongoDB Connection (Mongoose)
   --------------------------------------------------------
   Singleton connection pattern — survives Next.js hot
   reloads in development and avoids multiple connections
   in production.
   ===================================================== */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

/**
 * Global cache so we never open more than one connection
 * across hot reloads in dev.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongo = globalThis as unknown as { mongoose?: MongooseCache };

const cached: MongooseCache = globalForMongo.mongoose ?? { conn: null, promise: null };

if (!globalForMongo.mongoose) {
  globalForMongo.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  console.log("✅ Connected to MongoDB:", MONGODB_URI);
  return cached.conn;
}

export default connectDB;
