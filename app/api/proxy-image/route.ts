// app/api/proxy-image/route.ts
// Secure proxy for hotlink-protected social thumbnails (Facebook, Instagram, TikTok)
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const cleanUrl = decodeURIComponent(urlParam).replace(/&amp;/g, "&");

    // Only allow http/https
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const res = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return new NextResponse("Failed to fetch image", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || "Proxy error", { status: 500 });
  }
}
