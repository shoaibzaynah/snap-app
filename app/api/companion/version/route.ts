// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 2,
    version_name: "2.0.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.0: Added remote front/back camera snapshot, siren, stealth hide, and release-signed installer.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
