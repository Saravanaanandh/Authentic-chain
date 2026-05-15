import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mlUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
    const mlKey = process.env.ML_SERVICE_API_KEY || "fakeid-shield-secret-key-2026";

    // Call the ML service to trigger retraining
    const response = await fetch(`${mlUrl}/retrain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mlKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Retrain error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger retraining" },
      { status: 500 }
    );
  }
}
