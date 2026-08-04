import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ModelFeedback from "@/lib/models/ModelFeedback";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing feedback ID" }, { status: 400 });
    }

    await connectDB();
    const deleted = await ModelFeedback.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Feedback deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
