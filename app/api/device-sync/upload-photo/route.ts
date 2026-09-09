// app/api/device-sync/upload-photo/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_NAME } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const deviceId = formData.get("device_id") as string | null;
    const commandId = formData.get("command_id") as string | null;
    const cameraType = (formData.get("camera_type") as string) || "front";

    if (!file || !deviceId) {
      return NextResponse.json(
        { error: "photo file and device_id are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `${crypto.randomUUID()}.jpg`;
    const imagePath = `device-captures/${deviceId}/${filename}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(imagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imagePath);

    // If there was an associated command, mark it executed
    if (commandId) {
      await admin
        .from("device_commands")
        .update({
          status: "executed",
          result_media_path: imagePath,
          executed_at: new Date().toISOString(),
        })
        .eq("id", commandId);
    }

    // Broadcast Realtime event for instant dashboard snap refresh
    try {
      const channel = admin.channel(`device:${deviceId}`);
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            channel.send({
              type: "broadcast", event: "snap_uploaded",
              payload: { command_id: commandId, image_path: imagePath, camera_type: cameraType, public_url: publicUrlData.publicUrl },
            }).then(() => resolve()).catch(() => resolve());
          }
        });
      });
      admin.removeChannel(channel);
    } catch (ignored) {}

    return NextResponse.json({
      success: true,
      image_path: imagePath,
      public_url: publicUrlData.publicUrl,
      camera_type: cameraType,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
