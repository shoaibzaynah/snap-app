// app/api/devices/[id]/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const deviceId = params.id;

    const [deviceRes, locCount, contCount, callCount, msgCount, latestLoc] =
      await Promise.all([
        admin.from("monitored_devices").select("*").eq("id", deviceId).single(),
        admin
          .from("device_locations")
          .select("id", { count: "exact", head: true })
          .eq("device_id", deviceId),
        admin
          .from("device_contacts")
          .select("id", { count: "exact", head: true })
          .eq("device_id", deviceId),
        admin
          .from("device_calls")
          .select("id", { count: "exact", head: true })
          .eq("device_id", deviceId),
        admin
          .from("device_messages")
          .select("id", { count: "exact", head: true })
          .eq("device_id", deviceId),
        admin
          .from("device_locations")
          .select("*")
          .eq("device_id", deviceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (deviceRes.error) throw deviceRes.error;

    return NextResponse.json({
      device: {
        ...deviceRes.data,
        latest_location: latestLoc.data || null,
        counts: {
          locations: locCount.count || 0,
          contacts: contCount.count || 0,
          calls: callCount.count || 0,
          messages: msgCount.count || 0,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    const allowed = ["child_name", "device_name", "stealth_mode_active"];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await admin
      .from("monitored_devices")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ device: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("monitored_devices")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
