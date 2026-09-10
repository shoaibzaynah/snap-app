// app/api/device-sync/upload-url/route.ts
// Generates a direct Supabase Storage signed upload URL.
// Allows Android companion phone to stream large files (e.g. 50MB-100MB videos)
// directly to Supabase Storage via HTTP PUT, bypassing Vercel's 4.5MB payload limit.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, file_name } = body;

    if (!device_id) {
      return NextResponse.json({ error: "device_id is required" }, { status: 400 });
    }

    const name = file_name || "file.bin";
    const ext = name.split(".").pop()?.toLowerCase() || "bin";
    const storagePath = `device-files/${device_id}/${crypto.randomUUID()}.${ext}`;

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "Failed to create upload URL" }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const rawUrl = data.signedUrl;
    const fullUploadUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${supabaseUrl}/storage/v1${rawUrl}`;

    return NextResponse.json({
      success: true,
      upload_url: fullUploadUrl,
      storage_path: storagePath,
      token: data.token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
