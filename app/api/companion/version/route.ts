// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 9,
    version_name: "2.4.1",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.1: Samsung Android 13/14 background service persistence and exact alarm stability fixes.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
