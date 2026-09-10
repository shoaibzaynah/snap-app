// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 23,
    version_name: "2.9.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.9.0: Restored 100% non-blocking background sync service, persistent 24/7 watchdog, and ultra-low latency WebRTC stream.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}

