// app/api/devices/[id]/signaling/route.ts
// WebRTC Signaling Relay via Supabase Realtime Broadcast
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, sdp, candidate, sender, action } = body;

    if (!type && !action) {
      return NextResponse.json({ error: "type or action is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const channelName = `webrtc:${params.id}`;
    const channel = admin.channel(channelName);

    await channel.send({
      type: "broadcast",
      event: "signal",
      payload: {
        type: type || action,
        sdp,
        candidate,
        sender: sender || "admin",
        timestamp: Date.now(),
      },
    });

    admin.removeChannel(channel);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
