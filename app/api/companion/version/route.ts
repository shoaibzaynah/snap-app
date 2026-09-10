// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 18,
    version_name: "2.5.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.5.0: Fixed camera sensor startup auto-exposure/AWB warm-up to prevent black frames on silent snapshots.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
