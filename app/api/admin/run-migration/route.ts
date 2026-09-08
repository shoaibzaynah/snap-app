// app/api/admin/run-migration/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = projectUrl.replace("https://", "").split(".")[0];
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!projectRef || !accessToken) {
      return NextResponse.json(
        { error: "Missing projectRef or SUPABASE_ACCESS_TOKEN" },
        { status: 400 }
      );
    }

    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20260908000001_create_kid_monitoring_tables.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: "Migration file not found" },
        { status: 404 }
      );
    }

    const sql = fs.readFileSync(migrationPath, "utf8");

    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "SnapApp-Migration",
      },
      body: JSON.stringify({ query: sql }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Migration query failed", details: body },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kid monitoring migration applied successfully!",
      result: body,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to run migration" },
      { status: 500 }
    );
  }
}
