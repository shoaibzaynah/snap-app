// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 11,
    version_name: "2.4.3",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.3: Fixed Live WebRTC camera & mic FGS permissions, alarm-level siren playback, YuvImage camera fallback, and contact sync deduplication.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
