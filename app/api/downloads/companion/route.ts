// app/api/downloads/companion/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { COMPANION_APK_FILENAME } from "@/lib/companion-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "snap-safety-companion.apk");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "APK file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${COMPANION_APK_FILENAME}"`,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
