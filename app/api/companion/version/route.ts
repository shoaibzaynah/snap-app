// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 3,
    version_name: "2.1.0",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.1.0: Permanent unkillable process isolation (:sync), boot persistence, 15s/30s voice memos, on-demand apps, contacts, calls, and SMS sync.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
