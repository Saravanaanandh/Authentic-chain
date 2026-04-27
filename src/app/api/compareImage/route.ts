/* POST /api/compareImage — Image comparison module using MongoDB */

import { NextRequest, NextResponse } from "next/server";
import { generateImageHash, compareImages } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileImage } = body;

    if (!profileImage) {
      return NextResponse.json(
        { message: "profileImage is required (base64 or data-URL)" },
        { status: 400 }
      );
    }

    const imageHash = await generateImageHash(profileImage);
    const comparison = await compareImages(imageHash);

    return NextResponse.json({
      duplicate: comparison.duplicate,
      matchedProfiles: comparison.matchedProfiles,
      imageHash,
    });
  } catch (err: unknown) {
    console.error("compareImage error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
