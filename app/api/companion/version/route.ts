// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 24,
    version_name: "3.0.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v3.0.0: Restored 100% stable WebRTC live camera and microphone audio streaming, modern UI mode capsule, and 24/7 background sync service.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}

