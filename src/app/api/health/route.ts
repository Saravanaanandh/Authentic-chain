/* GET /api/health — System health & info (Landing Page API) */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

const startTime = Date.now();

export async function GET() {
  let dbStatus = "disconnected";
  try {
    const mongoose = await connectDB();
    dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: "running",
    app: "Fake Profile Detection System",
    version: "2.0",
    description:
      "AI-powered fake social media profile detection using multi-layer analysis, image comparison, Cloudinary storage, MongoDB persistence, and blockchain-backed verification proof.",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: dbStatus,
    storage: "cloudinary",
  });
}
