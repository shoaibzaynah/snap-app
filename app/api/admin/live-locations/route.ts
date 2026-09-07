import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = createAdminClient();

    // Query active location sessions and their latest coordinate update
    const { data: sessions, error } = await admin
      .from("location_sessions")
      .select(`
        id,
        status,
        started_at,
        image_links ( title ),
        location_updates (
          latitude,
          longitude,
          accuracy,
          created_at
        )
      `)
      .eq("status", "active")
      .order("started_at", { ascending: false });

    if (error) throw error;

    const locations = (sessions || [])
      .map((s: any) => {
        const updates = s.location_updates || [];
        if (updates.length === 0) return null;
        // Sort latest update
        updates.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latest = updates[0];
        return {
          sessionId: s.id,
          linkTitle: s.image_links?.title || "Untitled Snap",
          latitude: latest.latitude,
          longitude: latest.longitude,
          accuracy: latest.accuracy,
          updatedAt: latest.created_at,
          status: s.status,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ locations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
