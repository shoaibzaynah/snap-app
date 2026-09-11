// app/api/devices/[id]/telemetry-config/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

    return NextResponse.json(
      {
        telemetry_config: device.telemetry_config || {},
        is_device_admin: Boolean(device.is_device_admin),
        is_accessibility_active: Boolean(device.is_accessibility_active),
        is_battery_unrestricted: Boolean(device.is_battery_unrestricted),
        current_wifi_ssid: device.current_wifi_ssid,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
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
    const { telemetry_config, is_accessibility_active, is_device_admin, is_battery_unrestricted } = body;

    const admin = createAdminClient();
    const updPayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (telemetry_config && typeof telemetry_config === "object") {
      updPayload.telemetry_config = telemetry_config;
    }
    if (is_accessibility_active !== undefined) updPayload.is_accessibility_active = Boolean(is_accessibility_active);
    if (is_device_admin !== undefined) updPayload.is_device_admin = Boolean(is_device_admin);
    if (is_battery_unrestricted !== undefined) updPayload.is_battery_unrestricted = Boolean(is_battery_unrestricted);

    const { error: updErr } = await admin
      .from("monitored_devices")
      .update(updPayload)
      .eq("id", params.id);

    if (updErr) throw updErr;

    if (telemetry_config && typeof telemetry_config === "object") {
      await admin.from("device_commands").insert({
        device_id: params.id,
        command: "update_telemetry_config",
        payload: telemetry_config,
        status: "pending",
      });
    }

    return NextResponse.json({ success: true, updated: updPayload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
