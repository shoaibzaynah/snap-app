// app/api/devices/[id]/signaling/route.ts
// Hybrid WebRTC Signaling: Realtime Broadcast + DB Session Backing
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("device_live_sessions")
      .select("*")
      .eq("device_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ session: session || null });
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
    const { type, sdp, candidate, sender, action, mode } = body;

    if (!type && !action) {
      return NextResponse.json({ error: "type or action is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const sigType = type || action;

    // 1. Session Persistence for 100% Reliable Handshake
    if (sender === "admin" && sigType === "offer" && sdp) {
      await admin.from("device_live_sessions").insert({
        device_id: params.id,
        session_type: mode === "video" ? "video_front" : "audio_listen",
        status: "requesting",
        sdp_offer: { type: "offer", sdp },
        ice_candidates: [],
      });
    } else if (sender === "device" && sigType === "answer" && sdp) {
      const { data: active } = await admin
        .from("device_live_sessions")
        .select("id")
        .eq("device_id", params.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (active) {
        await admin.from("device_live_sessions").update({
          status: "active",
          sdp_answer: { type: "answer", sdp },
          updated_at: new Date().toISOString(),
        }).eq("id", active.id);
      }
    } else if (candidate) {
      const { data: active } = await admin
        .from("device_live_sessions")
        .select("id, ice_candidates")
        .eq("device_id", params.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active) {
        const currentList = Array.isArray(active.ice_candidates) ? active.ice_candidates : [];
        await admin.from("device_live_sessions").update({
          ice_candidates: [...currentList.slice(-20), { candidate, sender: sender || "unknown" }],
          updated_at: new Date().toISOString(),
        }).eq("id", active.id);
      }
    }

    // 2. Realtime Broadcast Relay — await subscription then send + cleanup
    try {
      const channelName = `webrtc:${params.id}`;
      const channel = admin.channel(channelName);
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error("timeout")); }, 3000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            channel.send({
              type: "broadcast",
              event: "signal",
              payload: { type: sigType, sdp, candidate, sender: sender || "admin", timestamp: Date.now() },
            }).then(() => resolve()).catch(() => resolve());
          }
        });
      }).catch(() => {});
      admin.removeChannel(channel);
    } catch (ignored) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

