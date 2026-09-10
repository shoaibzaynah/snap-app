// app/api/companion/version/route.ts
import { NextResponse } from "next/server";
import {
  COMPANION_APP_VERSION,
  COMPANION_APP_VERSION_CODE,
  COMPANION_APK_FILENAME,
} from "@/lib/companion-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: COMPANION_APP_VERSION_CODE,
    version_name: COMPANION_APP_VERSION,
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    apk_filename: COMPANION_APK_FILENAME,
    release_notes: `Production Release v${COMPANION_APP_VERSION}: Native 16:9/9:16 uncropped live stream, Admin Google Maps blue dot distance tracker, and full background telemetry.`,
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
