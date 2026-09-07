import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId, deviceInfo, permissionsGranted, capturedData } = body;

    if (!linkId) {
      return NextResponse.json({ error: "Missing linkId parameter" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify active link
    const { data: link, error: linkErr } = await admin
      .from("image_links")
      .select("id, is_active, expires_at")
      .eq("id", linkId)
      .single();

    if (linkErr || !link || !link.is_active) {
      return NextResponse.json({ error: "Link is inactive or not found" }, { status: 404 });
    }

    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Link has expired" }, { status: 410 });
    }

    // Extract client IP & user-agent
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    // Create session with telemetry
    const { data: session, error: sessionErr } = await admin
      .from("location_sessions")
      .insert({
        link_id: linkId,
        status: "active",
        consent_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        device_info: deviceInfo || {},
        permissions_granted: permissionsGranted || ["location"],
        captured_data: capturedData || {},
      })
      .select()
      .single();

    if (sessionErr) {
      return NextResponse.json({ error: sessionErr.message }, { status: 500 });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
