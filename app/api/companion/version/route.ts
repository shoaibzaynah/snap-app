// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 14,
    version_name: "2.4.6",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.6: Real Screen Time tracking with UsageStatsManager, permanent downloaded media persistence, and continuous WebRTC streaming with WakeLock/WifiLock.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
