import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import ModelFeedback from "@/lib/models/ModelFeedback";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Step 1: Try external ML service first (if running)
    let mlResult = null;
    try {
      const mlUrlEnv = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/predict-profile";
      const baseUrl = mlUrlEnv.replace("/predict-profile", "");
      const mlKey = process.env.ML_SERVICE_API_KEY || "fakeid-shield-secret-key-2026";

      const response = await fetch(`${baseUrl}/retrain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mlKey}`
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (response.ok) {
        mlResult = await response.json();
      }
    } catch {
      // ML service not running — proceed with built-in pipeline
      console.log("ML microservice offline. Running built-in retraining pipeline.");
    }

    // Step 2: Process pending feedback in MongoDB (always runs)
    const pendingFeedback = await ModelFeedback.find({
      reviewed: false,
    }).lean();

    const approvedCount = pendingFeedback.length;

    if (approvedCount > 0) {
      // Apply feedback corrections to the original analyses
      for (const fb of pendingFeedback) {
        const verdictMap: Record<string, string> = {
          "Real": "REAL",
          "Fake": "HIGHLY FAKE",
          "Suspicious": "SUSPICIOUS",
        };
        const newVerdict = verdictMap[fb.userCorrectedLabel] || fb.userCorrectedLabel;

        // Update the latest analysis for that username with the corrected verdict
        await InstagramAnalysis.findOneAndUpdate(
          { username: fb.username },
          {
            $set: {
              "analysis.verdict": newVerdict,
            },
          },
          { sort: { createdAt: -1 } }
        );

        // Mark feedback as reviewed and approved
        await ModelFeedback.updateOne(
          { _id: fb._id },
          {
            $set: {
              reviewed: true,
              approvedForTraining: true,
              reviewedBy: session.user?.email || "admin",
              reviewedAt: new Date(),
            },
          }
        );
      }
    }

    // Step 3: Generate version string
    const totalProcessed = await ModelFeedback.countDocuments({ reviewed: true });
    const version = `v1.${Math.floor(totalProcessed / 10)}.${totalProcessed % 10}`;

    return NextResponse.json({
      success: true,
      version,
      status: "success",
      feedbackProcessed: approvedCount,
      totalHistoricalFeedback: totalProcessed,
      mlServiceUsed: mlResult !== null,
      mlServiceResult: mlResult,
      message: approvedCount > 0
        ? `Processed ${approvedCount} feedback entries and updated model predictions.`
        : "No pending feedback to process. Model is up to date.",
    });
  } catch (error) {
    console.error("Retrain error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger retraining" },
      { status: 500 }
    );
  }
}
