// app/api/devices/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: devices, error } = await admin
      .from("monitored_devices")
      .select(`
        *,
        device_locations (
          id, latitude, longitude, accuracy, speed, battery_level, created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (devices || []).map((device: any) => {
      const locations = device.device_locations || [];
      locations.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latest_location = locations[0] || null;
      const is_online = Boolean(
        device.last_seen_at &&
        Date.now() - new Date(device.last_seen_at).getTime() < 180000
      );
      const { device_locations, ...rest } = device;
      return { ...rest, is_online, latest_location };
    });

    return NextResponse.json({ devices: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const childName = body.child_name?.trim();

    if (!childName) {
      return NextResponse.json(
        { error: "Child name is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const pairingCode = generatePairingCode();

    const { data, error } = await admin
      .from("monitored_devices")
      .insert({
        child_name: childName,
        device_name: body.device_name?.trim() || `${childName}'s Device`,
        model: body.model?.trim() || null,
        os_version: body.os_version?.trim() || null,
        pairing_code: pairingCode,
        battery_level: 100,
        is_charging: false,
        is_online: true,
        stealth_mode_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ device: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
