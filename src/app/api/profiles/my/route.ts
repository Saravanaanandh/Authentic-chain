/* GET /api/profiles/my — List profiles analyzed by the authenticated user */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import InstagramAnalysis from "@/lib/models/InstagramAnalysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    await connectDB();

    // Get the latest analysis per username scanned by this user
    const analyses = await InstagramAnalysis.aggregate([
      { $match: { scannedBy: userEmail } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$username",
          doc: { $first: "$$ROOT" },
        }
      },
      { $sort: { "doc.createdAt": -1 } }
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles = analyses.map((agg: any) => {
      const doc = agg.doc;
      return {
        id: doc._id.toString(),
        username: doc.username,
        followers: doc.profileData?.followersCount || 0,
        posts: doc.profileData?.postsCount || 0,
        accountAge: doc.profileData?.joinedRecently ? "New" : "Established",
        bio: doc.profileData?.biography || "",
        imageUrl: doc.profileData?.profilePicUrl || "",
        dataHash: doc.blockchainHash || "",
        riskScore: doc.analysis?.riskScore || 0,
        result: doc.analysis?.verdict === "HIGHLY FAKE" ? "FAKE" : (doc.analysis?.verdict || "SUSPICIOUS"),
        blockchainTx: doc.blockchainTx || "",
        createdAt: doc.createdAt,
        platform: "Instagram",
      };
    });

    return NextResponse.json({ profiles, count: profiles.length });
  } catch (err: unknown) {
    console.error("my profiles error:", err);
    return NextResponse.json(
      { message: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
