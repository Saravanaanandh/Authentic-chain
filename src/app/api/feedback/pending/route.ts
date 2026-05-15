import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import ModelFeedback from "@/lib/models/ModelFeedback";

export async function GET(req: NextRequest) {
  try {
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);

    // Ensure only admins can access this route
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const pendingFeedback = await ModelFeedback.find({ reviewed: false })
      .sort({ submittedAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, pendingFeedback });
  } catch (error) {
    console.error("Fetch pending feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
