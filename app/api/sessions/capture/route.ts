import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSnapImage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const file = formData.get("file") as File | null;

    if (!sessionId || !file) {
      return NextResponse.json({ error: "Missing sessionId or file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type && ["image/webp", "image/jpeg", "image/png"].includes(file.type)
      ? file.type
      : "image/webp";
    const extension = mimeType.includes("webp") ? "webp" : "jpg";
    const fileName = `capture_${sessionId}.${extension}`;
    const { imagePath } = await uploadSnapImage(buffer, mimeType, fileName);

    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from("location_sessions")
      .update({
        captured_media_path: imagePath,
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, capturedMediaPath: imagePath, session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload capture" }, { status: 500 });
  }
}
