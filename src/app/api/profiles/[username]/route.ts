/* /api/profiles/[username] — GET, DELETE, PATCH */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/* ---------- GET — Fetch a single profile by username ---------- */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await params;
    const doc = await InstagramAnalysis.findOne({ username }).sort({ createdAt: -1 }).lean();
    if (!doc) {
      return NextResponse.json(
        { message: `Profile "${username}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(doc);
  } catch (err: unknown) {
    console.error("profile lookup error:", err);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE — Admin only: delete all analyses for a username ---------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { username } = await params;

    const result = await InstagramAnalysis.deleteMany({ username });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile deleted successfully", deletedCount: result.deletedCount });
  } catch (err: unknown) {
    console.error("Delete profile error:", err);
    return NextResponse.json(
      { message: "Failed to delete profile" },
      { status: 500 }
    );
  }
}

/* ---------- PATCH — Admin only: update verdict / risk score ---------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { verdict, riskScore } = body;

    await connectDB();
    const { username } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (verdict) updateData["analysis.verdict"] = verdict;
    if (typeof riskScore === "number") {
      updateData["analysis.riskScore"] = riskScore;
      updateData["analysis.fakeProbability"] = riskScore;
    }

    const result = await InstagramAnalysis.updateMany(
      { username },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (err: unknown) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
