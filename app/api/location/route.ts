import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, latitude, longitude, accuracy } = body;

    if (!sessionId || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Invalid coordinate payload" }, { status: 400 });
    }

    // Validate coordinate ranges (CHECK constraints)
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Coordinates out of bounds" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify active session
    const { data: session } = await admin
      .from("location_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (!session || session.status !== "active") {
      return NextResponse.json({ error: "Session is not active" }, { status: 403 });
    }

    // Insert location update
    const { data: update, error: updateErr } = await admin
      .from("location_updates")
      .insert({
        session_id: sessionId,
        latitude,
        longitude,
        accuracy: typeof accuracy === "number" ? accuracy : null,
      })
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, update }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
