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
import { extractUsername } from "@/lib/instagramParser";
import { fetchInstagramProfile } from "@/lib/apifyService";
import { analyzeInstagramProfile } from "@/lib/fakeScoreEngine";
import { storeOnBlockchain } from "@/lib/blockchain";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";

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
          { success: false, error: message },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: message },
        { status: 502 }
      );
    }

    // ---- Analyse profile ----
    const analysis = analyzeInstagramProfile(profileData);

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
        .update(`${username}|${analysis.riskScore}|${timestamp}`)
        .digest("hex");

      const proof = await storeOnBlockchain(
        dataHash,
        analysis.verdict
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

    // Identify user
    let scannedBy = "anonymous";
    try {
      // Dynamic import to avoid breaking if auth config changes
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (session?.user?.email) scannedBy = session.user.email;
    } catch {
      // Proceed anonymously
    }

    const doc = await InstagramAnalysis.create({
      input: rawInput,
      username: profileData.username,
      profileData: {
        fullName: profileData.fullName,
        biography: profileData.biography,
        followersCount: profileData.followersCount,
        followsCount: profileData.followsCount,
        postsCount: profileData.postsCount,
        verified: profileData.verified,
        profilePicUrl: profileData.profilePicUrl,
        isPrivate: profileData.isPrivate,
        externalUrl: profileData.externalUrl,
        instagramId: profileData.id,
      },
      analysis: {
        riskScore: analysis.riskScore,
        fakeProbability: analysis.fakeProbability,
        verdict: analysis.verdict,
        reasons: analysis.reasons,
      },
      blockchainHash: blockchainProof?.dataHash || "",
      blockchainTx: blockchainProof?.txHash || "",
      scannedBy,
    });

    // ---- Response ----
    return NextResponse.json({
      success: true,
      profile: {
        username: profileData.username,
        fullName: profileData.fullName,
        biography: profileData.biography,
        followersCount: profileData.followersCount,
        followsCount: profileData.followsCount,
        postsCount: profileData.postsCount,
        verified: profileData.verified,
        profilePicUrl: profileData.profilePicUrl,
        isPrivate: profileData.isPrivate,
        externalUrl: profileData.externalUrl,
      },
      analysis: {
        riskScore: analysis.riskScore,
        fakeProbability: analysis.fakeProbability,
        verdict: analysis.verdict,
        reasons: analysis.reasons,
      },
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
