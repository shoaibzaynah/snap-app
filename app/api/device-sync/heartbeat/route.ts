// app/api/device-sync/heartbeat/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, pairing_code, battery_level, is_charging, model, os_version } = body;

    if (!device_id && !pairing_code) {
      return NextResponse.json(
        { error: "device_id or pairing_code is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Find device
    let query = admin.from("monitored_devices").select("id, child_name, pairing_code");
    if (device_id) query = query.eq("id", device_id);
    else if (pairing_code) query = query.eq("pairing_code", pairing_code);

    const { data: device, error: findErr } = await query.single();
    if (findErr || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Update heartbeat
    const updatePayload: Record<string, unknown> = {
      is_online: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (battery_level !== undefined) updatePayload.battery_level = Number(battery_level);
    if (is_charging !== undefined) updatePayload.is_charging = Boolean(is_charging);
    if (model) updatePayload.model = String(model);
    if (os_version) updatePayload.os_version = String(os_version);

    await admin.from("monitored_devices").update(updatePayload).eq("id", device.id);

    // Fetch pending commands
    const { data: pendingCommands } = await admin
      .from("device_commands")
      .select("*")
      .eq("device_id", device.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    // Mark pending commands as sent
    if (pendingCommands && pendingCommands.length > 0) {
      const commandIds = pendingCommands.map((c: any) => c.id);
      await admin
        .from("device_commands")
        .update({ status: "sent" })
        .in("id", commandIds);
    }

    // Check if device has locations, if not, use client IP geolocation as fallback
    const { count: locCount } = await admin
      .from("device_locations")
      .select("*", { count: "exact", head: true })
      .eq("device_id", device.id);

    if (!locCount || locCount === 0) {
      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(",")[0].trim() : null;
      if (clientIp && !clientIp.startsWith("127.") && !clientIp.startsWith("192.168.")) {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,lat,lon,city,country`).then((r) => r.json());
          if (geoRes && geoRes.status === "success" && geoRes.lat && geoRes.lon) {
            await admin.from("device_locations").insert({
              device_id: device.id,
              latitude: Number(geoRes.lat),
              longitude: Number(geoRes.lon),
              accuracy: 250,
              battery_level: battery_level !== undefined ? Number(battery_level) : null,
            });
          }
        } catch (ignored) {}
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const wsUrl = supabaseUrl
      ? `${supabaseUrl.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${anonKey}&vsn=1.0.0`
      : null;

    return NextResponse.json({
      success: true,
      device_id: device.id,
      child_name: device.child_name,
      commands: pendingCommands || [],
      realtime: wsUrl
        ? {
            ws_url: wsUrl,
            device_channel: `realtime:device:${device.id}`,
            webrtc_channel: `realtime:webrtc:${device.id}`,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
