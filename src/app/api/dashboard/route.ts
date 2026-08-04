import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";
import User from "@/lib/models/User";
import ModelFeedback from "@/lib/models/ModelFeedback";
import ModelVersion from "@/lib/models/ModelVersion";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.toLowerCase() || "";
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

    // 2. Query Profiles for the primary table
    const query: any = {};
    if (search) {
      query.username = { $regex: search, $options: "i" };
    }

    const [totalFiltered, docs, usersList, feedbackList, blockchainDocs] = await Promise.all([
      InstagramAnalysis.countDocuments(query),
      InstagramAnalysis.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.find({}, "name email role authProvider createdAt").sort({ createdAt: -1 }).lean(),
      ModelFeedback.find({
        $or: [{ reviewed: false }, { reviewed: { $exists: false } }]
      }).sort({ createdAt: -1 }).lean(),
      InstagramAnalysis.find({ blockchainTx: { $ne: "" } }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));

    // Map profiles
    const profiles = docs.map((doc: any) => ({
      id: doc._id.toString(),
      username: doc.username,
      result: doc.analysis?.verdict === "HIGHLY FAKE" ? "FAKE" : (doc.analysis?.verdict || "SUSPICIOUS"),
      riskScore: doc.analysis?.riskScore || 0,
      date: doc.createdAt,
      blockchainTx: doc.blockchainTx || "",
      imageUrl: doc.profileData?.profilePicUrl || "",
      platform: "Instagram"
    }));

    // Map blockchain transactions
    const blockchainTxns = blockchainDocs.map((doc: any) => ({
      id: doc._id.toString(),
      username: doc.username,
      blockchainTx: doc.blockchainTx,
      blockchainHash: doc.blockchainHash,
      date: doc.createdAt,
    }));

    // Deduplicate feedback list by normalized username, submitter, and correction label
    const seenFeedbackKeys = new Set<string>();
    const uniqueFeedbackList = (feedbackList || []).filter((fb: any) => {
      const cleanUser = (fb.username || "").toLowerCase().replace(/^@/, "");
      const submitter = (fb.submittedBy || "anonymous").toLowerCase();
      const key = `${cleanUser}:${submitter}:${fb.userCorrectedLabel}`;
      if (seenFeedbackKeys.has(key)) return false;
      seenFeedbackKeys.add(key);
      return true;
    });

    // Calculate dynamic model stats for pending (unretrained) feedback
    const pendingCount = uniqueFeedbackList.length;
    const correctedCount = uniqueFeedbackList.filter((f: any) => f.userCorrectedLabel !== f.originalPrediction).length;
    
    // Fetch active model accuracy from model_versions collection
    const activeModelDoc = await ModelVersion.findOne({ deploymentStatus: "ACTIVE" })
      .sort({ trainingDate: -1 })
      .lean();
    
    const accuracyRate = activeModelDoc
      ? Math.round((activeModelDoc.accuracy > 1 ? activeModelDoc.accuracy / 100 : activeModelDoc.accuracy) * 100)
      : 93;

    return NextResponse.json({
      profiles,
      users: usersList,
      feedbacks: uniqueFeedbackList,
      blockchainTxns,
      stats: {
        totalProfiles: total,
        fakeCount: highlyFakeCount,
        realCount,
        suspiciousCount,
        avgTrustScore,
      },
      modelStats: {
        accuracy: accuracyRate,
        feedbackCount: pendingCount,
        correctedCount,
        analyzedCount: total,
        pendingCount,
        activeVersion: activeModelDoc?.versionNumber || "v1.0.0"
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
