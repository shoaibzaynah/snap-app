// app/api/devices/[id]/data/download/route.ts
// Direct download redirect: signs a Supabase Storage URL with Content-Disposition: attachment
// and 302-redirects the browser directly to Supabase CDN. This completely bypasses Vercel's
// 4.5MB serverless response payload limit, allowing fast, direct downloads of 100MB+ videos.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const name = searchParams.get("name") || "download";

    if (!path || !params.id) {
      return NextResponse.json({ error: "path and device id required" }, { status: 400 });
    }

    const safeFileName = name.replace(/[^a-z0-9._\-]/gi, "_");
    const admin = createAdminClient();

    // Create signed URL with Supabase native attachment header
    const { data, error } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600, {
        download: safeFileName,
      });

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "Could not sign URL" }, { status: 500 });
    }

    // 302 redirect browser directly to Supabase CDN — zero Vercel bandwidth or payload limits
    return NextResponse.redirect(data.signedUrl, 302);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

