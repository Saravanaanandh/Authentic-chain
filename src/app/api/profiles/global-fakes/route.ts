/* GET /api/profiles/global-fakes — Restricted list of FAKE profiles for admin review */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";

export const dynamic = "force-dynamic";

/**
 * Blur a username: show first 3-4 chars, rest as asterisks.
 */
function blurUsername(username: string): string {
  const visibleChars = Math.min(4, Math.max(3, Math.floor(username.length / 3)));
  const visible = username.slice(0, visibleChars);
  const hidden = "*".repeat(Math.max(4, username.length - visibleChars));
  return visible + hidden;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Access denied. Restricted for data security." },
        { status: 403 }
      );
    }

    await connectDB();

    // Get only FAKE/HIGHLY FAKE profiles — latest per username
    const analyses = await InstagramAnalysis.aggregate([
      {
        $match: {
          "analysis.verdict": { $in: ["FAKE", "HIGHLY FAKE"] }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$username",
          doc: { $first: "$$ROOT" },
        }
      },
      { $sort: { "doc.createdAt": -1 } },
      { $limit: 100 }
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles = analyses.map((agg: any) => {
      const doc = agg.doc;
      return {
        id: doc._id.toString(),
        username: blurUsername(doc.username),
        imageUrl: doc.profileData?.profilePicUrl || "",
        riskScore: doc.analysis?.riskScore || 0,
        verdict: "FAKE",
        detectionDate: doc.createdAt,
        platform: "Instagram",
      };
    });

    return NextResponse.json({ profiles, count: profiles.length });
  } catch (err: unknown) {
    console.error("global fakes error:", err);
    return NextResponse.json(
      { message: "Failed to fetch fake profiles" },
      { status: 500 }
    );
  }
}
