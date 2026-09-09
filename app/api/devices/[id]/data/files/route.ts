// app/api/devices/[id]/data/files/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      // Bulk delete all files for this device
      const admin = createAdminClient();
      const { data: files } = await admin.from("device_files").select("storage_path").eq("device_id", params.id);
      
      if (files && files.length > 0) {
        const paths = files.map(f => f.storage_path).filter(Boolean);
        if (paths.length > 0) {
          await admin.storage.from("snap-images").remove(paths);
        }
      }
      
      await admin.from("device_files").delete().eq("device_id", params.id);
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();
    const { data: file } = await admin.from("device_files").select("storage_path").eq("id", fileId).eq("device_id", params.id).single();
    
    if (file?.storage_path) {
      await admin.storage.from("snap-images").remove([file.storage_path]);
    }
    
    await admin.from("device_files").delete().eq("id", fileId).eq("device_id", params.id);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}