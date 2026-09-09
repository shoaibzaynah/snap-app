// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 1,
    version_name: "1.0.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Lifetime update engine active. 24/7 background telemetry & GPS sync.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
