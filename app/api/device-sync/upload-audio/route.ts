// app/api/device-sync/upload-audio/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    const deviceId = formData.get("device_id") as string | null;
    const commandId = formData.get("command_id") as string | null;
    const duration = Number(formData.get("duration_seconds") || 15);

    if (!file || !deviceId) {
      return NextResponse.json({ error: "audio file and device_id are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `${crypto.randomUUID()}.m4a`;
    const audioPath = `device-audio/${deviceId}/${filename}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(audioPath, buffer, {
        contentType: file.type || "audio/mp4",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(audioPath);

    if (commandId) {
      await admin
        .from("device_commands")
        .update({
          status: "executed",
          result_media_path: audioPath,
          executed_at: new Date().toISOString(),
        })
        .eq("id", commandId);
    }

    return NextResponse.json({
      success: true,
      audio_path: audioPath,
      public_url: publicUrlData.publicUrl,
      duration_seconds: duration,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
