// app/api/devices/[id]/data/wifi/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: networks, error } = await admin
      .from("device_wifi_networks")
      .select("*")
      .eq("device_id", params.id)
      .order("scanned_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ networks: networks || [] });
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
    const { networks, connected_ssid } = body;

    const admin = createAdminClient();

    // Update current_wifi_ssid on monitored_devices
    if (connected_ssid !== undefined) {
      await admin
        .from("monitored_devices")
        .update({
          current_wifi_ssid: connected_ssid || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);
    }

    if (Array.isArray(networks) && networks.length > 0) {
      const rows = networks.map((n: any) => ({
        device_id: params.id,
        ssid: n.ssid || "Unknown SSID",
        bssid: n.bssid || "",
        signal_level: n.signal_level || 0,
        is_connected: Boolean(n.is_connected),
        scanned_at: new Date().toISOString(),
      }));

      await admin.from("device_wifi_networks").insert(rows);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("device_wifi_networks")
      .delete()
      .eq("device_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
