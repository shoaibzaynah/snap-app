// app/api/devices/[id]/data/download/route.ts
// Proxy download: fetches from Supabase Storage and streams to browser with
// proper Content-Disposition so the browser triggers a Save dialog, not a tab open.
// This is required because browsers block cross-origin anchor[download] for large files.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const name = searchParams.get("name") || "download";

    if (!path || !params.id) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create signed URL valid for 60 minutes
    const { data, error } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
    }

    // Fetch the file from Supabase and stream to client
    const upstream = await fetch(data.signedUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Storage fetch failed" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const safeFileName = name.replace(/[^a-z0-9._\-]/gi, "_");

    // Stream body to browser with Content-Disposition: attachment
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
