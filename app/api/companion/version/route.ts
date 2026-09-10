// app/api/companion/version/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    version_code: 10,
    version_name: "2.4.2",
    min_supported_version: 1,
    apk_url: "/api/downloads/companion",
    release_notes: "Production Release v2.4.2: Native OEM App Hiding for Samsung One UI, Vivo Funtouch, Oppo ColorOS, and Tecno HiOS.",
    mandatory_update: false,
    updated_at: new Date().toISOString(),
  });
}
