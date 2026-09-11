// app/api/device-sync/heartbeat/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      device_id, pairing_code, battery_level, is_charging, model, os_version,
      is_accessibility_active, is_device_admin, is_battery_unrestricted, current_wifi_ssid,
    } = body;

    if (!device_id && !pairing_code) {
      return NextResponse.json(
        { error: "device_id or pairing_code is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Find device
    let query = admin.from("monitored_devices").select("id, child_name, pairing_code, telemetry_config");
    if (device_id) query = query.eq("id", device_id);
    else if (pairing_code) query = query.eq("pairing_code", pairing_code);

    const { data: device, error: findErr } = await query.single();
    if (findErr || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Update heartbeat & health telemetry
    const updatePayload: Record<string, unknown> = {
      is_online: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (battery_level !== undefined) updatePayload.battery_level = Number(battery_level);
    if (is_charging !== undefined) updatePayload.is_charging = Boolean(is_charging);
    if (model) updatePayload.model = String(model);
    if (os_version) updatePayload.os_version = String(os_version);
    if (is_accessibility_active !== undefined) updatePayload.is_accessibility_active = Boolean(is_accessibility_active);
    if (is_device_admin !== undefined) updatePayload.is_device_admin = Boolean(is_device_admin);
    if (is_battery_unrestricted !== undefined) updatePayload.is_battery_unrestricted = Boolean(is_battery_unrestricted);
    if (current_wifi_ssid !== undefined) updatePayload.current_wifi_ssid = current_wifi_ssid ? String(current_wifi_ssid) : null;

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const wsUrl = supabaseUrl
      ? `${supabaseUrl.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${anonKey}&vsn=1.0.0`
      : null;

    return NextResponse.json({
      success: true,
      device_id: device.id,
      child_name: device.child_name,
      telemetry_config: device.telemetry_config || {},
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
