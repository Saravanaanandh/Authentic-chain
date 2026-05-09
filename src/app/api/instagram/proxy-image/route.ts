/* =====================================================
   API Route — GET /api/instagram/proxy-image
   --------------------------------------------------------
   Server-side proxy for Instagram CDN profile pictures.
   Instagram CDN sends Cross-Origin-Resource-Policy: same-origin,
   blocking direct browser <img> requests. This route
   fetches the image server-side and pipes it to the client.
   ===================================================== */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow Instagram CDN domains
  try {
    const parsed = new URL(url);
    const allowed = [
      "cdninstagram.com",
      "fbcdn.net",
      "instagram.com",
    ];
    const isAllowed = allowed.some((domain) =>
      parsed.hostname.endsWith(domain)
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Only Instagram CDN URLs are allowed" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const imgRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${imgRes.status}` },
        { status: 502 }
      );
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    );
  }
}
