/* GET /api/result/[id] — Fetch verification result by ID from MongoDB */

import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfileById(id);
    if (!profile) {
      return NextResponse.json(
        { message: `Result with id "${id}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      username: profile.username,
      status: profile.result,
      riskScore: profile.riskScore,
      reasons: profile.reasons || [],
      imageUrl: profile.imageUrl,
      blockchainTx: profile.blockchainTx,
      createdAt: profile.createdAt,
    });
  } catch (err: unknown) {
    console.error("result lookup error:", err);
    return NextResponse.json(
      { message: "Failed to fetch result" },
      { status: 500 }
    );
  }
}
