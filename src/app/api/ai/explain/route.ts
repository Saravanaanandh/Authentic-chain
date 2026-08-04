import { NextRequest, NextResponse } from "next/server";
import { explainPrediction } from "@/services/aiExplanationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/explain
 * Accept prediction results and metadata to generate a Generative AI explanation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prediction,
      followers,
      following,
      posts,
      bio,
      hasProfilePic,
      riskScore,
      reasons,
    } = body;

    // Simple validation
    if (prediction === undefined || followers === undefined || following === undefined || posts === undefined) {
      return NextResponse.json(
        { error: "Missing required prediction or profile metadata properties in request body." },
        { status: 400 }
      );
    }

    const aiResult = await explainPrediction({
      prediction: String(prediction),
      followers: Number(followers),
      following: Number(following),
      posts: Number(posts),
      bio: String(bio || ""),
      hasProfilePic: Boolean(hasProfilePic),
      riskScore: Number(riskScore || 0),
      reasons: Array.isArray(reasons) ? reasons : [],
    });

    return NextResponse.json(aiResult);
  } catch (error: any) {
    console.error("❌ API explain error:", error);
    return NextResponse.json(
      {
        explanation: "An unexpected error occurred while generating the AI prediction explanation.",
        riskLevel: "MEDIUM",
        suggestions: ["Please manually inspect the user profile signals.", "Verify connectivity to Gemini API."]
      },
      { status: 500 }
    );
  }
}
