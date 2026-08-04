import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

// PATCH — Modify user role
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Role updated successfully", user: updated });
  } catch (err: any) {
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// DELETE — Delete user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ message: "Missing email" }, { status: 400 });
    }

    await connectDB();
    const deleted = await User.findOneAndDelete({ email });

    if (!deleted) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
