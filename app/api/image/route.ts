// app/api/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const externalUrl = searchParams.get("url");

    if (!path && !externalUrl) {
      return NextResponse.json({ error: "Missing image path or url parameter" }, { status: 400 });
    }

    // 1. Supabase Storage Bucket Image Proxy (snap-images)
    // Serves snap images without Supabase's restrictive 'x-robots-tag: none' header
    // so WhatsApp, Facebook, Telegram & iMessage crawlers display rich preview cards
    if (path) {
      const cleanPath = path.replace(/^\/+/, "").replace(/\.\.\//g, "");
      const admin = createAdminClient();
      const { data, error } = await admin.storage.from("snap-images").download(cleanPath);

      if (error || !data) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const ext = cleanPath.split(".").pop()?.toLowerCase() || "jpeg";
      const contentType = MIME_TYPES[ext] || data.type || "image/jpeg";

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2. External URL image proxy for social platforms with strict hotlinking
    if (externalUrl) {
      if (!externalUrl.startsWith("http://") && !externalUrl.startsWith("https://")) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }

      const res = await fetch(externalUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/*,*/*;q=0.8",
        },
        next: { revalidate: 86400 },
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch image" }, { status: res.status });
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
