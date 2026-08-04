import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import ModelFeedback from "@/lib/models/ModelFeedback";

// Simple in-memory rate limiter (per IP, 10 requests / minute)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
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
      username: rawUsername,
      sourcePlatform,
      originalPrediction,
      originalFakeProbability,
      userCorrectedLabel,
      feedbackReason,
      notes,
      profileSnapshot,
      predictionId,
      isCorrect,
    } = body;

    const cleanUsername = (rawUsername || profileSnapshot?.username || "").trim().replace(/^@/, "");
    const username = cleanUsername;
    const prediction = originalPrediction || "SUSPICIOUS";
    const fakeProb = originalFakeProbability ?? 50;

    if (!username || !userCorrectedLabel || !feedbackReason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: Username, Corrected Label, or Reason." },
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

    // Step 3: Check if feedback has ALREADY been submitted for this profile (case insensitive, with or without @)
    const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const usernameRegex = new RegExp(`^@?${escapedUsername}$`, "i");

    const existingFeedback = await ModelFeedback.findOne({
      username: usernameRegex,
      $or: [
        { submittedBy: submittedBy !== "anonymous" ? submittedBy : "____impossible____" },
        { reviewed: false }
      ]
    });

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, error: "Feedback has already been submitted for this profile." },
        { status: 400 }
      );
    }

    // Step 5: Save feedback document in feedback_data collection
    const feedback = await ModelFeedback.create({
      username,
      sourcePlatform: sourcePlatform || "instagram",
      originalPrediction: prediction,
      originalFakeProbability: fakeProb,
      userCorrectedLabel,
      isCorrect: isCorrect !== undefined ? isCorrect : userCorrectedLabel === prediction,
      feedbackReason,
      notes: notes || "",
      profileSnapshot,
      submittedBy,
      source: "user_feedback",
      verified: true,
      reviewed: false,
      approvedForTraining: true,
    });

    // Step 5 & 7: Forward feedback to Python ML Microservice to automatically update training_data
    try {
      const mlUrlEnv = process.env.ML_SERVICE_URL || "http://127.0.0.1:8888/predict-profile";
      const mlFeedbackUrl = mlUrlEnv.replace(/\/predict-profile\/?$/, "") + "/feedback";
      const mlKey = process.env.ML_SERVICE_API_KEY || "fakeid-shield-secret-key-2026";
      
      await fetch(mlFeedbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mlKey}`
        },
        body: JSON.stringify({
          predictionId: predictionId || "",
          username,
          sourcePlatform: sourcePlatform || "instagram",
          originalPrediction: prediction,
          originalFakeProbability: fakeProb,
          userCorrectedLabel,
          isCorrect: isCorrect !== undefined ? isCorrect : userCorrectedLabel === prediction,
          feedbackReason,
          notes: notes || "",
          profileSnapshot: profileSnapshot || null,
          submittedBy,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (mlErr) {
      console.warn("⚠️ Syncing feedback with ML microservice warning:", mlErr);
    }

    return NextResponse.json({ success: true, id: feedback._id });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
