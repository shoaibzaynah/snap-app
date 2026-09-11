// app/api/devices/[id]/data/files/route.ts
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
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const fileId = searchParams.get("file_id");
    const admin = createAdminClient();
    let query = admin.from("device_files").select("*").eq("device_id", params.id);
    if (fileId) {
      query = query.eq("id", fileId);
    } else {
      query = query.order("updated_at", { ascending: false }).limit(limit);
    }
    const { data: files, error } = await query;

    if (error) throw error;
    return NextResponse.json({ files: files || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");
    const storagePath = searchParams.get("storage_path");

    const admin = createAdminClient();

    if (!fileId) {
      // Bulk delete all files for this device — also clean storage
      const { data: allFiles } = await admin
        .from("device_files")
        .select("storage_path")
        .eq("device_id", params.id)
        .not("storage_path", "is", null);

      if (allFiles && allFiles.length > 0) {
        const paths = allFiles.map((f: any) => f.storage_path).filter(Boolean);
        if (paths.length > 0) {
          await admin.storage.from(BUCKET_NAME).remove(paths);
        }
      }

      await admin.from("device_files").delete().eq("device_id", params.id);
      return NextResponse.json({ success: true });
    }

    // Single file delete — also clean storage if path provided
    if (storagePath) {
      await admin.storage.from(BUCKET_NAME).remove([storagePath]);
    } else {
      // Fetch storage_path from DB before deleting
      const { data: file } = await admin
        .from("device_files")
        .select("storage_path")
        .eq("id", fileId)
        .eq("device_id", params.id)
        .maybeSingle();
      if (file?.storage_path) {
        await admin.storage.from(BUCKET_NAME).remove([file.storage_path]);
      }
    }

    await admin.from("device_files").delete().eq("id", fileId).eq("device_id", params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}