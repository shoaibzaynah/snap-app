// app/api/devices/[id]/signaling/route.ts
// WebRTC Signaling: DB persistence (fallback) + Supabase Realtime Broadcast (primary)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

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

async function broadcastSignal(deviceId: string, payload: Record<string, any>) {
  const admin = createAdminClient();
  const channelName = `webrtc:${deviceId}`;
  const channel = admin.channel(channelName);
  try {
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 2000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          channel.send({ type: "broadcast", event: "signal", payload })
            .then(() => resolve()).catch(() => resolve());
        }
      });
    });
  } finally {
    admin.removeChannel(channel);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, sdp, candidate, sender, action, mode } = body;
    if (!type && !action) return NextResponse.json({ error: "type or action required" }, { status: 400 });

    const admin = createAdminClient();
    const sigType = type || action;

    // ── DB persistence (for polling fallback) ──
    if (sender === "admin" && sigType === "offer" && sdp) {
      // Delete stale sessions for this device before inserting new
      await admin.from("device_live_sessions").delete().eq("device_id", params.id);
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
        const list = Array.isArray(active.ice_candidates) ? active.ice_candidates : [];
        await admin.from("device_live_sessions").update({
          ice_candidates: [...list.slice(-20), { candidate, sender: sender || "unknown" }],
          updated_at: new Date().toISOString(),
        }).eq("id", active.id);
      }
    }

    // ── Broadcast relay (primary path for offers/answers/commands — fire & don't block) ──
    if (sigType !== "candidate") {
      broadcastSignal(params.id, {
        type: sigType, sdp, candidate, sender: sender || "admin", timestamp: Date.now(),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
