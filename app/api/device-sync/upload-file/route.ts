// app/api/device-sync/upload-file/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for large video uploads (Vercel Pro)
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();
    const contentTypeHeader = request.headers.get("content-type") || "";

    let deviceId: string | null = null;
    let storagePath: string | null = null;
    let commandId: string | null = null;
    let fileId: string | null = null;
    let originalName = "file";
    let targetFilePath: string | null = null;

    if (contentTypeHeader.includes("application/json")) {
      // Direct-to-Supabase upload confirmation
      const body = await request.json();
      deviceId = body.device_id;
      storagePath = body.storage_path;
      commandId = body.command_id;
      fileId = body.file_id;
      originalName = body.file_name || "file";
      targetFilePath = body.file_path;

      if (!deviceId || !storagePath) {
        return NextResponse.json({ error: "device_id and storage_path required" }, { status: 400 });
      }
    } else {
      // Legacy multipart upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      deviceId = formData.get("device_id") as string | null;
      commandId = formData.get("command_id") as string | null;
      fileId = formData.get("file_id") as string | null;
      originalName = (formData.get("file_name") as string) || file?.name || "file";
      targetFilePath = (formData.get("file_path") as string) || null;

      if (!file || !deviceId) {
        return NextResponse.json({ error: "file and device_id are required" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
      storagePath = `device-files/${deviceId}/${crypto.randomUUID()}.${ext}`;

      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
        mp4: "video/mp4", m4v: "video/mp4", mov: "video/mp4",
        m4a: "audio/m4a", mp3: "audio/mpeg", aac: "audio/aac", "3gp": "audio/3gpp", amr: "audio/amr",
        pdf: "application/pdf", vcf: "text/vcard", txt: "text/plain",
      };
      const contentType = mimeMap[ext] || (file.type && file.type !== "application/octet-stream" ? file.type : "image/jpeg");

      const { error: uploadError } = await admin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, { contentType, upsert: false });

      if (uploadError) throw uploadError;
    }


    const { data: publicUrlData } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    let targetFileId = fileId;
    if (commandId) {
      const { data: cmdRow } = await admin.from("device_commands").select("payload").eq("id", commandId).maybeSingle();
      if (cmdRow?.payload?.file_id && !targetFileId) targetFileId = cmdRow.payload.file_id;
      if (cmdRow?.payload?.file_path && !targetFilePath) targetFilePath = cmdRow.payload.file_path;
    }

    if (targetFileId) {
      await admin
        .from("device_files")
        .update({
          storage_path: storagePath,
          thumbnail_path: publicUrlData.publicUrl,
        })
        .eq("id", targetFileId);
    }
    if (targetFilePath) {
      await admin
        .from("device_files")
        .update({
          storage_path: storagePath,
          thumbnail_path: publicUrlData.publicUrl,
        })
        .eq("device_id", deviceId)
        .eq("file_path", targetFilePath);
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
