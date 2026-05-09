/* GET /api/dashboard — Dashboard view with filters and stats from MongoDB */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);

    // ---------- Filters ----------
    let filter = searchParams.get("filter")?.toUpperCase() || "ALL";
    if (filter === "FAKE") filter = "HIGHLY FAKE"; // Map FAKE to HIGHLY FAKE for query
    const search = searchParams.get("search")?.toLowerCase() || "";
    const platform = searchParams.get("platform") || "All";
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    await connectDB();

    // 1. Calculate Stats
    const [total, highlyFakeCount, realCount, suspiciousCount, avgAgg] = await Promise.all([
      InstagramAnalysis.countDocuments(),
      InstagramAnalysis.countDocuments({ "analysis.verdict": "HIGHLY FAKE" }),
      InstagramAnalysis.countDocuments({ "analysis.verdict": "REAL" }),
      InstagramAnalysis.countDocuments({ "analysis.verdict": "SUSPICIOUS" }),
      InstagramAnalysis.aggregate([{ $group: { _id: null, avgRisk: { $avg: "$analysis.riskScore" } } }]),
    ]);
    const avgRiskScore = avgAgg.length > 0 ? Math.round(avgAgg[0].avgRisk) : 0;
    const avgTrustScore = 100 - avgRiskScore;

    // 2. Query Profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (filter && filter !== "ALL") {
      query["analysis.verdict"] = filter;
    }
    if (search) {
      query.username = { $regex: search, $options: "i" };
    }
    // Hardcode Instagram for now, but structure for future scaling
    if (platform !== "All" && platform !== "Instagram") {
      // If platform is Facebook, Twitter, LinkedIn, we have 0 since they aren't implemented
      query._id = null; // force empty
    }

    const [totalFiltered, docs] = await Promise.all([
      InstagramAnalysis.countDocuments(query),
      InstagramAnalysis.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));

    // ---------- Map to dashboard view ----------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles = docs.map((doc: any) => ({
      id: doc._id.toString(),
      username: doc.username,
      result: doc.analysis?.verdict === "HIGHLY FAKE" ? "FAKE" : (doc.analysis?.verdict || "SUSPICIOUS"),
      riskScore: doc.analysis?.riskScore || 0,
      date: doc.createdAt,
      blockchainTx: doc.blockchainTx || "",
      imageUrl: doc.profileData?.profilePicUrl 
        ? `/api/instagram/proxy-image?url=${encodeURIComponent(doc.profileData.profilePicUrl)}`
        : "",
      platform: "Instagram"
    }));

    return NextResponse.json({
      profiles,
      stats: {
        totalProfiles: total,
        fakeCount: highlyFakeCount,
        realCount,
        suspiciousCount,
        avgTrustScore,
      },
      pagination: {
        page: Math.min(page, totalPages),
        limit,
        totalFiltered,
        totalPages,
      },
    });
  } catch (err: unknown) {
    console.error("dashboard error:", err);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
