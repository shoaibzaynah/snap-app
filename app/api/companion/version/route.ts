// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 4,
    version_name: "2.2.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.2.0: Fresh package ID to eliminate previous signature conflict, Snap Safety branding, unkillable :sync persistence.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
