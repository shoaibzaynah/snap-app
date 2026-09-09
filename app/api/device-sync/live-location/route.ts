// app/api/device-sync/live-location/route.ts
// High-Frequency Live Movement Streamer (<3s updates)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, latitude, longitude, accuracy, speed, heading, battery_level, persist } = body;

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!device_id || isNaN(lat) || isNaN(lng) || (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)) {
      return NextResponse.json({ error: "Missing or invalid non-zero coordinates" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Broadcast instantaneously via Realtime Channel for zero-latency map animation
    try {
      const liveChannel = admin.channel(`device-live:${device_id}`);
      await liveChannel.send({
        type: "broadcast",
        event: "location",
        payload: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: Number(accuracy || 5),
          speed: speed ? Number(speed) : null,
          heading: heading ? Number(heading) : null,
          battery_level: battery_level !== undefined ? Number(battery_level) : null,
          timestamp: new Date().toISOString(),
        },
      });
      admin.removeChannel(liveChannel);
    } catch (ignored) {}

    // 2. Conditionally persist to database (e.g. every 30s or when persist=true) to avoid DB bloat
    if (persist) {
      await admin.from("device_locations").insert({
        device_id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: accuracy ? Number(accuracy) : null,
        speed: speed ? Number(speed) : null,
        battery_level: battery_level !== undefined ? Number(battery_level) : null,
      });

      await admin.from("monitored_devices").update({
        last_seen_at: new Date().toISOString(),
        is_online: true,
      }).eq("id", device_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
