// app/api/sessions/media/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSnapImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const mediaType = (formData.get("mediaType") as string) || "audio";
    const file = formData.get("file") as File | null;

    if (!sessionId || !file) {
      return NextResponse.json({ error: "Missing sessionId or file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = mediaType === "video" ? "mp4" : "m4a";
    const mimeType = mediaType === "video" ? "video/mp4" : "audio/mp4";
    const fileName = `${mediaType}_${sessionId}_${Date.now()}.${ext}`;

    const { imagePath } = await uploadSnapImage(buffer, mimeType, fileName);

    const admin = createAdminClient();
    const updatePayload: Record<string, string> = {};
    if (mediaType === "video") updatePayload.captured_video_path = imagePath;
    else updatePayload.captured_audio_path = imagePath;

    const { error } = await admin
      .from("location_sessions")
      .update(updatePayload)
      .eq("id", sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true, mediaPath: imagePath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload session media" }, { status: 500 });
  }
}
