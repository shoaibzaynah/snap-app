import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, latitude, longitude, accuracy, visitNumber } = body;

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

    // Check previous update to prevent duplicate jitter noise & table bloat
    const { data: latest } = await admin
      .from("location_updates")
      .select("latitude, longitude, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      const dLat = (latitude - latest.latitude) * (Math.PI / 180);
      const dLon = (longitude - latest.longitude) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(latest.latitude * (Math.PI / 180)) * Math.cos(latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
      const dist = 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const elapsedSec = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
      if (dist < 25 || elapsedSec < 15) {
        return NextResponse.json({ success: true, skipped: true, reason: "below_threshold" }, { status: 200 });
      }
    }

    // Insert location update with visit number
    const { data: update, error: updateErr } = await admin
      .from("location_updates")
      .insert({
        session_id: sessionId,
        latitude,
        longitude,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        visit_number: typeof visitNumber === "number" ? visitNumber : 1,
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
