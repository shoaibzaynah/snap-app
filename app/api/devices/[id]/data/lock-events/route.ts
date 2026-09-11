// app/api/devices/[id]/data/lock-events/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from("device_lock_events")
      .select("*")
      .eq("device_id", params.id)
      .order("event_time", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ events: events || [] });
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
    const { event_type } = body;

    if (!event_type || !["screen_on", "screen_off", "user_present"].includes(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("device_lock_events")
      .insert({
        device_id: params.id,
        event_type,
        event_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, event: data });
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
      .from("device_lock_events")
      .delete()
      .eq("device_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
