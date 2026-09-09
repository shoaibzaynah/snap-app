// app/api/device-sync/location/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, latitude, longitude, accuracy, speed, altitude, battery_level } = body;

    if (!device_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "device_id, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)) {
      return NextResponse.json({ error: "Invalid coordinate bounds or zero coordinates" }, { status: 400 });
    }

    const admin = createAdminClient();

    const [insertRes] = await Promise.all([
      admin.from("device_locations").insert({
        device_id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy !== undefined ? Number(accuracy) : null,
        speed: speed !== undefined ? Number(speed) : null,
        altitude: altitude !== undefined ? Number(altitude) : null,
        battery_level: battery_level !== undefined ? Number(battery_level) : null,
      }).select().single(),
      admin.from("monitored_devices").update({
        last_seen_at: new Date().toISOString(),
        battery_level: battery_level !== undefined ? Number(battery_level) : undefined,
        is_online: true,
      }).eq("id", device_id),
    ]);

    if (insertRes.error) throw insertRes.error;
    return NextResponse.json({ success: true, location: insertRes.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
