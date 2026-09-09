// app/api/device-sync/upload-file/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const deviceId = formData.get("device_id") as string | null;
    const commandId = formData.get("command_id") as string | null;
    const fileId = formData.get("file_id") as string | null;
    const originalName = (formData.get("file_name") as string) || file?.name || "file";

    if (!file || !deviceId) {
      return NextResponse.json({ error: "file and device_id are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = originalName.split(".").pop() || "bin";
    const storagePath = `device-files/${deviceId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    if (fileId) {
      await admin
        .from("device_files")
        .update({
          storage_path: storagePath,
          thumbnail_path: publicUrlData.publicUrl,
        })
        .eq("id", fileId);
    }

    if (commandId) {
      await admin
        .from("device_commands")
        .update({
          status: "executed",
          result_media_path: storagePath,
          executed_at: new Date().toISOString(),
        })
        .eq("id", commandId);
    }

    // Broadcast Realtime event for instant dashboard notification
    try {
      const channel = admin.channel(`device:${deviceId}`);
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            channel.send({
              type: "broadcast", event: "file_uploaded",
              payload: { file_id: fileId, storage_path: storagePath, file_name: originalName, public_url: publicUrlData.publicUrl },
            }).then(() => resolve()).catch(() => resolve());
          }
        });
      });
      admin.removeChannel(channel);
    } catch (ignored) {}

    return NextResponse.json({
      success: true,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
