// app/api/device-sync/live-location/route.ts
// High-Frequency Live Movement Streamer (3-10s updates when live tracking enabled)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, latitude, longitude, accuracy, speed, heading, battery_level } = body;

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!device_id || isNaN(lat) || isNaN(lng) || (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)) {
      return NextResponse.json({ error: "Missing or invalid non-zero coordinates" }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // 1. UPDATE current location on monitored_devices (single row overwrite, not insert)
    // This triggers Postgres Changes → dashboard subscribes → map marker moves instantly
    await admin.from("monitored_devices").update({
      current_latitude: lat,
      current_longitude: lng,
      current_accuracy: accuracy ? Number(accuracy) : null,
      location_updated_at: now,
      last_seen_at: now,
      is_online: true,
    }).eq("id", device_id);

    // 2. Broadcast via Realtime for zero-latency map animation (<50ms)
    // This is BACKUP — primary is Postgres Changes on monitored_devices
    try {
      const channel = admin.channel(`device-live:${device_id}`);
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 1500);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            channel.send({
              type: "broadcast", event: "location",
              payload: {
                latitude: lat, longitude: lng,
                accuracy: Number(accuracy || 5),
                speed: speed ? Number(speed) : null,
                heading: heading ? Number(heading) : null,
                battery_level: battery_level !== undefined ? Number(battery_level) : null,
                timestamp: now,
              },
            }).then(() => resolve()).catch(() => resolve());
          }
        });
      });
      admin.removeChannel(channel);
    } catch (ignored) {}

    // 3. History insert only every 30s (phone controls this with persist flag)
    // Live-movement at 3s interval should NOT insert every time — table bloat
    // Only insert if >10m moved (tighter than normal 15m because live mode)
    if (body.persist) {
      const { data: lastLoc } = await admin
        .from("device_locations")
        .select("latitude, longitude")
        .eq("device_id", device_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const moved = !lastLoc || distanceMeters(lat, lng, lastLoc.latitude, lastLoc.longitude) > 30;
      if (moved) {
        await admin.from("device_locations").insert({
          device_id, latitude: lat, longitude: lng,
          accuracy: accuracy ? Number(accuracy) : null,
          speed: speed ? Number(speed) : null,
          battery_level: battery_level !== undefined ? Number(battery_level) : null,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
