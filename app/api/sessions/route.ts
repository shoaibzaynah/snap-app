import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupIpCarrier } from "@/lib/ip-lookup";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId, deviceInfo, permissionsGranted, capturedData, visitorToken } = body;

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

    // Extract client IP, user-agent, and server-side edge geo headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    const city = request.headers.get("x-vercel-ip-city") || request.headers.get("cf-ipcity") || undefined;
    const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || undefined;
    const region = request.headers.get("x-vercel-ip-country-region") || request.headers.get("cf-region") || undefined;
    const ispHeader = request.headers.get("x-vercel-ip-as-number") || undefined;

    // Fast asynchronous IP to SIM Carrier / ISP lookup
    const ipGeo = await lookupIpCarrier(ipAddress);
    const isCellular = Boolean(deviceInfo?.isCellular || ipGeo.isCellular);
    const resolvedCarrier = ipGeo.carrier || ipGeo.isp || undefined;

    const mergedDeviceInfo = {
      ...(deviceInfo || {}),
      city: ipGeo.city || city || deviceInfo?.city,
      country: ipGeo.country || country || deviceInfo?.country,
      region: ipGeo.region || region || deviceInfo?.region,
      isp: ipGeo.isp || deviceInfo?.isp || ispHeader,
      carrier: resolvedCarrier || deviceInfo?.carrier,
      isCellular: isCellular,
      connectionType: isCellular ? "Mobile SIM" : (deviceInfo?.connectionType || "WiFi / Broadband"),
    };

    // Calculate visit sequence number for this returning device/visitor
    let visitNumber = 1;
    if (visitorToken) {
      const { count } = await admin
        .from("location_sessions")
        .select("id", { count: "exact", head: true })
        .eq("link_id", linkId)
        .eq("visitor_token", visitorToken);
      visitNumber = (count || 0) + 1;
    }

    // Every click creates a fresh audit session with its own distinct media & coordinate timeline
    const nowIso = new Date().toISOString();
    const { data: session, error: sessionErr } = await admin
      .from("location_sessions")
      .insert({
        link_id: linkId,
        visitor_token: visitorToken || crypto.randomUUID(),
        status: "active",
        consent_at: nowIso,
        started_at: nowIso,
        last_visited_at: nowIso,
        visit_count: visitNumber,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_info: mergedDeviceInfo,
        permissions_granted: permissionsGranted || ["location"],
        captured_data: capturedData || {},
      })
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    return NextResponse.json({ session, isRepeatVisit: visitNumber > 1, visitNumber }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
