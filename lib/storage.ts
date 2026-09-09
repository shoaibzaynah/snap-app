// lib/storage.ts
// Programmatic storage operations for snap-images bucket
import { createAdminClient } from "./supabase/admin";

export const BUCKET_NAME = "snap-images";
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/mpeg",
  "audio/3gpp",
  "audio/amr",
  "video/mp4",
  "application/pdf",
  "text/vcard",
  "text/plain",
];
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function uploadSnapImage(
  fileBuffer: Buffer | ArrayBuffer,
  mimeType: string,
  originalFilename: string
): Promise<{ imagePath: string; publicUrl: string }> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported MIME type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }

  const byteLength = fileBuffer instanceof Buffer ? fileBuffer.length : fileBuffer.byteLength;
  if (byteLength > MAX_FILE_SIZE) {
    throw new Error(`File size ${byteLength} exceeds maximum allowed 25MB`);
  }

  // Generate safe random UUID filename
  const extension = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
  const validExtensions = ["jpeg", "jpg", "png", "webp", "gif", "m4a", "mp4", "3gp", "amr", "aac", "webm", "vcf"];
  const safeExtension = validExtensions.includes(extension) ? extension : "jpg";
  const filename = `${crypto.randomUUID()}.${safeExtension}`;
  const imagePath = `snaps/${filename}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(BUCKET_NAME)
    .upload(imagePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload snap image: ${error.message}`);
  }

  const { data: publicUrlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(imagePath);

  return {
    imagePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

export function getSnapImageUrl(imagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
}

export async function deleteSnapImage(imagePath: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET_NAME).remove([imagePath]);
  if (error) {
    console.error("Storage delete error:", error.message);
  }
}
