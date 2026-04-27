/* GET /api/dashboard — Dashboard view with filters and stats from MongoDB */

import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats, getFilteredProfiles } from "@/lib/store";
import type { ProfileStatus } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);

    // ---------- Filters ----------
    const filter = searchParams.get("filter")?.toUpperCase() as
      | ProfileStatus
      | "ALL"
      | null;
    const search = searchParams.get("search")?.toLowerCase() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    // ---------- Parallel: Stats + Filtered profiles ----------
    const [stats, result] = await Promise.all([
      getDashboardStats(),
      getFilteredProfiles({
        filter: filter || "ALL",
        search,
        page,
        limit,
      }),
    ]);

    const avgTrustScore = 100 - stats.avgRiskScore;

    // ---------- Map to dashboard view ----------
    const profiles = result.profiles.map((p) => ({
      id: p.id,
      username: p.username,
      result: p.result,
      riskScore: p.riskScore,
      date: p.createdAt,
      blockchainTx: p.blockchainTx,
      imageUrl: p.imageUrl,
    }));

    return NextResponse.json({
      profiles,
      stats: {
        totalProfiles: stats.totalProfiles,
        fakeCount: stats.fakeCount,
        realCount: stats.realCount,
        suspiciousCount: stats.suspiciousCount,
        avgTrustScore,
      },
      pagination: {
        page: result.page,
        limit: result.limit,
        totalFiltered: result.totalFiltered,
        totalPages: result.totalPages,
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
