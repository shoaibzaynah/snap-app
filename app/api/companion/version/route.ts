// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 13,
    version_name: "2.4.5",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.5: 64KB high-speed media upload streaming and 10s fallback command polling for 3-5x faster file transfers.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
