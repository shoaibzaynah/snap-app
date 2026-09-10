// app/api/device-sync/location/route.ts
// Standard location sync — called by heartbeat (every 20-35s)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, latitude, longitude, accuracy, speed, altitude, battery_level } = body;

    if (!device_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "device_id, latitude, and longitude are required" }, { status: 400 });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)) {
      return NextResponse.json({ error: "Invalid coordinate bounds or zero coordinates" }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // 1. UPDATE current location on monitored_devices (single row, no table bloat)
    await admin.from("monitored_devices").update({
      current_latitude: lat,
      current_longitude: lng,
      current_accuracy: accuracy !== undefined ? Number(accuracy) : null,
      location_updated_at: now,
      last_seen_at: now,
      battery_level: battery_level !== undefined ? Number(battery_level) : undefined,
      is_online: true,
    }).eq("id", device_id);

    // 2. INSERT into history table (for path tracking on map)
    // Only insert if location actually changed significantly (>30m) to prevent GPS drift noise
    const { data: lastLoc } = await admin
      .from("device_locations")
      .select("latitude, longitude")
      .eq("device_id", device_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const shouldInsert = !lastLoc || distanceMeters(lat, lng, lastLoc.latitude, lastLoc.longitude) > 30;

    if (shouldInsert) {
      await admin.from("device_locations").insert({
        device_id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy !== undefined ? Number(accuracy) : null,
        speed: speed !== undefined ? Number(speed) : null,
        altitude: altitude !== undefined ? Number(altitude) : null,
        battery_level: battery_level !== undefined ? Number(battery_level) : null,
      });
    }

    return NextResponse.json({ success: true, persisted: shouldInsert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Haversine distance in meters — used to skip near-duplicate inserts */
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
