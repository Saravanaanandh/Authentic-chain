/* GET /api/profiles — List all verified profiles from MongoDB */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";

export async function GET() {
  try {
    await connectDB();
    
    // Aggregate to get the latest analysis per username, and collect all scanners
    const analyses = await InstagramAnalysis.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$username",
          doc: { $first: "$$ROOT" },
          scanners: { $addToSet: "$scannedBy" }
        }
      },
      { $sort: { "doc.createdAt": -1 } }
    ]);
    
    // Map to the shape expected by History page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles = analyses.map((agg: any) => {
      const doc = agg.doc;
      // remove anonymous from scanners
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analyzedBy = agg.scanners.filter((s: any) => s && s !== "anonymous");
      
      return {
        id: doc._id.toString(),
        username: doc.username,
        followers: doc.profileData?.followersCount || 0,
        posts: doc.profileData?.postsCount || 0,
        accountAge: doc.profileData?.joinedRecently ? "New" : "Established",
        bio: doc.profileData?.biography || "",
        imageHash: "",
        imageUrl: doc.profileData?.profilePicUrl 
          ? `/api/instagram/proxy-image?url=${encodeURIComponent(doc.profileData.profilePicUrl)}`
          : "",
        dataHash: doc.blockchainHash || "",
        riskScore: doc.analysis?.riskScore || 0,
        result: doc.analysis?.verdict === "HIGHLY FAKE" ? "FAKE" : (doc.analysis?.verdict || "SUSPICIOUS"),
        blockchainTx: doc.blockchainTx || "",
        createdAt: doc.createdAt,
        analyzedBy,
        platform: "Instagram",
      };
    });

    return NextResponse.json({ profiles, count: profiles.length });
  } catch (err: unknown) {
    console.error("profiles error:", err);
    return NextResponse.json(
      { message: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
