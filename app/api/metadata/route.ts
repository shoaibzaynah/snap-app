// app/api/metadata/route.ts
// Scrapes OpenGraph metadata from any destination URL
import { NextResponse } from "next/server";
import { fetchUrlMetadata } from "@/lib/metadata";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid target URL is required" }, { status: 400 });
    }

    // Ensure valid protocol
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const metadata = await fetchUrlMetadata(formattedUrl);

    return NextResponse.json({
      success: true,
      url: formattedUrl,
      metadata,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
