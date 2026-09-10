// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 12,
    version_name: "2.4.4",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.4: Fixed WebRTC audio dropping after 10-15 seconds (persistent AudioSource & VideoSource handles), Siren playback, and Contact deduplication.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
