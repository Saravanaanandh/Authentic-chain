import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelFeedback from "@/lib/models/ModelFeedback";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");
    if (!rawUsername || typeof rawUsername !== "string" || !rawUsername.trim()) {
      return NextResponse.json({ hasSubmitted: false });
    }

    const username = rawUsername.trim().toLowerCase();
    await connectDB();

    let userEmail = "anonymous";
    try {
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      if (session?.user?.email) userEmail = session.user.email;
    } catch {
      // ignore
    }

    // Check if feedback exists for this username by this user or in general
    const query: any = { username: new RegExp(`^${username}$`, "i") };
    if (userEmail !== "anonymous") {
      query.$or = [{ submittedBy: userEmail }, { username: new RegExp(`^${username}$`, "i") }];
    }

    const existing = await ModelFeedback.findOne(query);
    return NextResponse.json({ hasSubmitted: !!existing });
  } catch (error) {
    console.error("Check feedback error:", error);
    return NextResponse.json({ hasSubmitted: false });
  }
}
