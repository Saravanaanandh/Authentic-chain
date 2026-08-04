/* =====================================================
   API Route — POST /api/instagram/analyze
   --------------------------------------------------------
   Accepts an Instagram URL or username, scrapes public
   profile data via Apify, runs the fake-score engine,
   optionally stores a blockchain proof, and persists
   the analysis in MongoDB.
   ===================================================== */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";
import { authOptions } from "@/lib/auth";
import { extractUsername } from "@/lib/instagramParser";
import { fetchInstagramProfile } from "@/lib/apifyService";
import { analyzeInstagramProfile } from "@/lib/fakeScoreEngine";
import { storeOnBlockchain } from "@/lib/blockchain";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";
import PredictionHistory from "@/lib/models/PredictionHistory";
import { mapApifyToPredictionInput, callExternalPredictionAPI } from "@/services/externalPredictionService";
import { calculateHybridScore } from "@/utils/hybridScoreEngine";
import { validateProfileExists, returnValidationError } from "@/utils/profileExistenceValidator";
import { uploadImageFromUrl } from "@/lib/cloudinaryUploadUrl";


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
    // ---- Authentication check ----
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please login to analyze profiles." },
        { status: 401 }
      );
    }
    const scannedBy = session.user.email;

    // ---- Rate limit ----
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded — please wait a moment." },
        { status: 429 }
      );
    }

    // ---- Parse body ----
    const body = await req.json();
    const rawInput: string = body?.input;

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide an Instagram URL or username." },
        { status: 400 }
      );
    }

    // ---- Extract username ----
    const username = extractUsername(rawInput);
    if (!username) {
      return NextResponse.json(
        { success: false, error: "Invalid Instagram URL or username." },
        { status: 400 }
      );
    }

    // ---- Fetch profile from Apify ----
    let profileData;
    try {
      profileData = await fetchInstagramProfile(username);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch profile.";

      if (message.includes("quota")) {
        return NextResponse.json(
          { success: false, error: "API quota exceeded — please try again later." },
          { status: 429 }
        );
      }
      if (message.includes("not found") || message.includes("private")) {
        return NextResponse.json(
          returnValidationError(username),
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: message },
        { status: 502 }
      );
    }

    if (!validateProfileExists(profileData)) {
      return NextResponse.json(
        returnValidationError(username),
        { status: 404 }
      );
    }

    // ---- Upload profile image to Cloudinary ----
    let cloudinaryImageUrl = "";
    if (profileData.profilePicUrl) {
      try {
        const uploadResult = await uploadImageFromUrl(
          profileData.profilePicUrl,
          profileData.username
        );
        cloudinaryImageUrl = uploadResult.url;
      } catch (imgErr) {
        console.warn("⚠️ Cloudinary image upload failed:", imgErr);
        // Continue without Cloudinary URL
      }
    }

    // ---- 1. Run Local Behavioral Analysis Engine ----
    const localAnalysis = analyzeInstagramProfile(profileData);

    // ---- 2. Call Python ML Microservice (Advanced Ensemble Verification on localhost:8888/predict-profile) ----
    let pythonEnsembleAnalysis: any = null;
    try {
      const mlUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8888/predict-profile";
      const mlKey = process.env.ML_SERVICE_API_KEY || "fakeid-shield-secret-key-2026";
      
      const mlResponse = await fetch(mlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mlKey}`
        },
        body: JSON.stringify({
          platform: "instagram",
          username: profileData.username,
          bio: profileData.biography || "",
          followers: profileData.followersCount || 0,
          following: profileData.followsCount || 0,
          posts: profileData.postsCount || 0,
          verified: !!profileData.verified,
          profileImageUrl: profileData.profilePicUrl || ""
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        pythonEnsembleAnalysis = {
          riskScore: mlData.fakeProbability ?? 50,
          fakeProbability: mlData.fakeProbability ?? 50,
          verdict: mlData.finalPrediction || mlData.prediction || "SUSPICIOUS",
          reasons: mlData.reasons || [],
          tabularScore: mlData.tabularScore ?? mlData.breakdown?.tabularScore ?? 50,
          imageScore: mlData.imageScore ?? mlData.breakdown?.imageScore ?? 50,
          bioScore: mlData.bioScore ?? mlData.breakdown?.bioScore ?? 50,
          anomalyScore: mlData.anomalyScore ?? mlData.breakdown?.anomalyScore ?? 20,
          predictionId: mlData.predictionId || "",
        };
      } else {
        console.warn(`Python ML Service returned status ${mlResponse.status}`);
      }
    } catch (mlErr) {
      console.log("Python ML Microservice offline or failed, using local analysis fallback.", mlErr);
    }

    // Set Local Analysis as internal and Python ML Microservice as Advanced Ensemble Verification
    const internalAnalysis = localAnalysis;
    const externalAnalysis = pythonEnsembleAnalysis || { unavailable: true };

    // ---- 3. Hybrid Fusion Engine ----
    const hybridAnalysis = calculateHybridScore(externalAnalysis, internalAnalysis);


    // ---- Blockchain proof (optional — gracefully skip on failure) ----
    let blockchainProof: {
      txHash: string;
      blockNumber?: number;
      dataHash: string;
      timestamp: string;
    } | null = null;

    try {
      const { createHash } = await import("crypto");
      const timestamp = new Date().toISOString();
      const dataHash = createHash("sha256")
        .update(`${username}|${hybridAnalysis.finalRiskScore}|${timestamp}`)
        .digest("hex");

      const proof = await storeOnBlockchain(
        dataHash,
        hybridAnalysis.finalVerdict
      );

      blockchainProof = {
        txHash: proof.txHash,
        blockNumber: proof.blockNumber,
        dataHash,
        timestamp,
      };
    } catch (bcErr) {
      console.warn("⚠️  Blockchain proof skipped:", bcErr);
    }

    // ---- Persist to MongoDB ----
    await connectDB();

    const doc = await InstagramAnalysis.create({
      input: rawInput,
      username: profileData.username,
      profileData: {
        username: profileData.username,
        fullName: profileData.fullName,
        biography: profileData.biography,
        followersCount: profileData.followersCount,
        followsCount: profileData.followsCount,
        postsCount: profileData.postsCount,
        verified: profileData.verified,
        // Store Cloudinary URL instead of original Apify URL
        profilePicUrl: cloudinaryImageUrl || profileData.profilePicUrl,
        isPrivate: profileData.isPrivate,
        externalUrl: profileData.externalUrl,
        instagramId: profileData.id,
      },
      analysis: {
        riskScore: hybridAnalysis.finalRiskScore,
        fakeProbability: hybridAnalysis.finalFakeProbability,
        verdict: hybridAnalysis.finalVerdict,
        reasons: hybridAnalysis.combinedReasons,
        tabularScore: internalAnalysis.tabularScore,
        imageScore: internalAnalysis.imageScore,
        bioScore: internalAnalysis.bioScore,
        anomalyScore: internalAnalysis.anomalyScore,
      },
      externalAnalysis,
      internalAnalysis,
      hybridAnalysis,
      sourcePlatform: "instagram",
      apifyRawData: profileData,
      blockchainHash: blockchainProof?.dataHash || "",
      blockchainTx: blockchainProof?.txHash || "",
      scannedBy,
    });

    // Step 4: Persist to prediction_history collection
    try {
      const predId = crypto.randomUUID();
      await PredictionHistory.create({
        predictionId: predId,
        username: profileData.username,
        profileFeatures: {
          platform: "instagram",
          followers: profileData.followersCount,
          following: profileData.followsCount,
          posts: profileData.postsCount,
          verified: profileData.verified,
          bio: profileData.biography,
          profileImageUrl: cloudinaryImageUrl || profileData.profilePicUrl,
        },
        prediction: hybridAnalysis.finalVerdict,
        confidence: Math.min(100, Math.abs(hybridAnalysis.finalFakeProbability - 50) * 2),
        riskScore: hybridAnalysis.finalFakeProbability,
        modelsUsed: [
          "Decision Tree Classifier",
          "Random Forest Classifier",
          "Naive Bayes Classifier",
          "XGBoost Classifier",
          "LightGBM Classifier",
          "Isolation Forest Anomaly Detector"
        ],
        predictionTimestamp: new Date(),
        blockchainHash: blockchainProof?.dataHash || "",
        cloudinaryImageUrl: cloudinaryImageUrl || profileData.profilePicUrl,
        feedbackStatus: "pending",
      });
    } catch (phErr) {
      console.warn("⚠️  PredictionHistory write warning:", phErr);
    }

    // ---- Response ----
    // Return Cloudinary URL in apifyData for frontend display
    const responseApifyData = {
      ...profileData,
      profilePicUrl: cloudinaryImageUrl || profileData.profilePicUrl,
    };

    return NextResponse.json({
      success: true,
      username: profileData.username,
      apifyData: responseApifyData,
      internalAnalysis,
      externalAnalysis,
      hybridAnalysis,
      blockchainProof: blockchainProof
        ? {
            txHash: blockchainProof.txHash,
            dataHash: blockchainProof.dataHash,
            timestamp: blockchainProof.timestamp,
          }
        : null,
      id: doc._id,
    });
  } catch (error) {
    console.error("Instagram analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
