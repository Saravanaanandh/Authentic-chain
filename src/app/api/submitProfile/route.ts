/* POST /api/submitProfile — Accept, validate, verify, upload image, store, and return result */

import { NextRequest, NextResponse } from "next/server";
import { verifyProfile } from "@/lib/verification";
import { storeOnBlockchain } from "@/lib/blockchain";
import { addProfile } from "@/lib/store";
import { uploadImage } from "@/lib/cloudinary";
import { StoredProfile } from "@/lib/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Simple in-memory rate limiter (per IP) to prevent blockchain spam
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const rateRecord = rateLimitMap.get(ip) || { count: 0, timestamp: now };
    
    if (now - rateRecord.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateRecord.count = 1;
      rateRecord.timestamp = now;
    } else {
      rateRecord.count += 1;
    }
    rateLimitMap.set(ip, rateRecord);

    if (rateRecord.count > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    const body = await req.json();
    const { username, followers, posts, accountAge, bio, profileImage } = body;

    // -------- Validation --------
    const errors: string[] = [];

    if (!username || typeof username !== "string" || username.trim() === "") {
      errors.push("username is required and must be a non-empty string.");
    }

    const followersNum = Number(followers);
    if (isNaN(followersNum) || followersNum < 0) {
      errors.push("followers must be a number >= 0.");
    }

    const postsNum = Number(posts);
    if (isNaN(postsNum) || postsNum < 0) {
      errors.push("posts must be a number >= 0.");
    }

    if (!accountAge || typeof accountAge !== "string") {
      errors.push("accountAge is required.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // -------- Verification --------
    const result = await verifyProfile({
      username: username.trim(),
      followers: followersNum,
      posts: postsNum,
      accountAge,
      bio: bio || "",
      profileImage,
    });

    // -------- Image Upload to Cloudinary --------
    let imageUrl = "";
    let imagePublicId = "";

    if (profileImage) {
      try {
        const upload = await uploadImage(profileImage, username.trim());
        imageUrl = upload.url;
        imagePublicId = upload.publicId;
        console.log(`☁️  Image uploaded to Cloudinary: ${imageUrl}`);
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        // Continue without image — don't block the verification
      }
    }

    // -------- Blockchain proof --------
    const proof = await storeOnBlockchain(result.dataHash, result.status);

    // -------- Persist to MongoDB --------
    const id = crypto.randomUUID();
    const profile: StoredProfile = {
      id,
      username: username.trim(),
      followers: followersNum,
      posts: postsNum,
      accountAge,
      bio: bio || "",
      imageHash: result.imageHash,
      imageUrl,
      imagePublicId,
      dataHash: result.dataHash,
      riskScore: result.riskScore,
      result: result.status,
      blockchainTx: proof.txHash,
      reasons: result.reasons,
      analyzedBy: userEmail ? [userEmail] : [],
      createdAt: new Date().toISOString(),
    };
    await addProfile(profile);

    // -------- Response --------
    return NextResponse.json({
      message: "Profile received successfully",
      status: "pending_verification",
      verification: {
        id,
        username: profile.username,
        riskScore: result.riskScore,
        status: result.status,
        reasons: result.reasons,
        dataHash: result.dataHash,
        imageHash: result.imageHash,
        imageUrl,
        blockchainTx: proof.txHash,
        imageComparison: result.imageComparison,
        createdAt: profile.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error("submitProfile error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
