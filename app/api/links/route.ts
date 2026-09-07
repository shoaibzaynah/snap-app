import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSnapImage, deleteSnapImage } from "@/lib/storage";

// Generate cryptographically random non-sequential slug (AGENTS.md Rule 9)
function generateSafeSlug(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: links, error } = await admin
      .from("image_links")
      .select("*, location_sessions(id, status, location_updates(id))")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ links });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || null;
    const description = (formData.get("description") as string) || null;
    const requiresLocation = formData.get("requires_location") === "true";
    const expiresInHours = formData.get("expires_in_hours")
      ? Number(formData.get("expires_in_hours"))
      : null;

    if (!file) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { imagePath } = await uploadSnapImage(buffer, file.type, file.name);

    let expiresAt: string | null = null;
    if (expiresInHours && expiresInHours > 0) {
      const exp = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
      expiresAt = exp.toISOString();
    }

    const slug = generateSafeSlug();
    const admin = createAdminClient();

    const { data: link, error } = await admin
      .from("image_links")
      .insert({
        slug,
        image_path: imagePath,
        title,
        description,
        requires_location: requiresLocation,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ link }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, is_active } = await request.json();
    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: link, error } = await admin
      .from("image_links")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ link });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing link ID" }, { status: 400 });

    const admin = createAdminClient();
    const { data: link } = await admin.from("image_links").select("image_path").eq("id", id).single();

    if (link?.image_path) {
      await deleteSnapImage(link.image_path);
    }

    const { error } = await admin.from("image_links").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
