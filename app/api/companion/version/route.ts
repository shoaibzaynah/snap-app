// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 15,
    version_name: "2.4.7",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.7: Smart GPS movement filtering, stale cache rejection, and real movement trajectory without tele-portation jumps.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
