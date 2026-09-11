// app/api/devices/[id]/telemetry-config/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: device, error } = await admin
      .from("monitored_devices")
      .select("id, telemetry_config, is_device_admin, is_accessibility_active, is_battery_unrestricted, current_wifi_ssid")
      .eq("id", params.id)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({
      telemetry_config: device.telemetry_config || {},
      is_device_admin: Boolean(device.is_device_admin),
      is_accessibility_active: Boolean(device.is_accessibility_active),
      is_battery_unrestricted: Boolean(device.is_battery_unrestricted),
      current_wifi_ssid: device.current_wifi_ssid,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { telemetry_config } = body;

    if (!telemetry_config || typeof telemetry_config !== "object") {
      return NextResponse.json({ error: "Invalid telemetry_config" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Update telemetry_config on device
    const { error: updErr } = await admin
      .from("monitored_devices")
      .update({
        telemetry_config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updErr) throw updErr;

    // Dispatch command to companion so it applies toggles in real-time
    await admin.from("device_commands").insert({
      device_id: params.id,
      command: "update_telemetry_config",
      payload: telemetry_config,
      status: "pending",
    });

    return NextResponse.json({ success: true, telemetry_config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
