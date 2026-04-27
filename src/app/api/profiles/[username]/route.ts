/* GET /api/profiles/[username] — Fetch a single profile by username from MongoDB */

import { NextRequest, NextResponse } from "next/server";
import { getProfileByUsername } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const profile = await getProfileByUsername(username);
    if (!profile) {
      return NextResponse.json(
        { message: `Profile "${username}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(profile);
  } catch (err: unknown) {
    console.error("profile lookup error:", err);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
