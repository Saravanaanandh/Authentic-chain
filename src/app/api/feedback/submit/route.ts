import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import ModelFeedback from "@/lib/models/ModelFeedback";

// Simple in-memory rate limiter (per IP, 3 requests / minute)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded — please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      username,
      sourcePlatform,
      originalPrediction,
      originalFakeProbability,
      userCorrectedLabel,
      feedbackReason,
      notes,
      profileSnapshot,
    } = body;

    if (!username || !originalPrediction || !userCorrectedLabel || !feedbackReason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    await connectDB();

    let submittedBy = "anonymous";
    try {
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (session?.user?.email) submittedBy = session.user.email;
    } catch {
      // ignore
    }

    const feedback = await ModelFeedback.create({
      username,
      sourcePlatform: sourcePlatform || "instagram",
      originalPrediction,
      originalFakeProbability,
      userCorrectedLabel,
      feedbackReason,
      notes,
      profileSnapshot,
      submittedBy,
    });

    return NextResponse.json({ success: true, id: feedback._id });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
