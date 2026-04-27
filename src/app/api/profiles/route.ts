/* GET /api/profiles — List all verified profiles from MongoDB */

import { NextResponse } from "next/server";
import { getAllProfiles } from "@/lib/store";

export async function GET() {
  try {
    const profiles = await getAllProfiles();
    return NextResponse.json({ profiles, count: profiles.length });
  } catch (err: unknown) {
    console.error("profiles error:", err);
    return NextResponse.json(
      { message: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
