// app/api/devices/[id]/webrtc/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("device_live_sessions")
      .select("*")
      .eq("device_id", params.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ active_session: data || null });
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
    const { action, session_type = "video_front", sdp_offer, sdp_answer, candidate } = body;
    const admin = createAdminClient();

    if (action === "start") {
      // End previous sessions
      await admin
        .from("device_live_sessions")
        .update({ status: "ended" })
        .eq("device_id", params.id)
        .eq("status", "active");

      // Insert new session
      const { data, error } = await admin
        .from("device_live_sessions")
        .insert({
          device_id: params.id,
          session_type,
          status: "active",
          sdp_offer: sdp_offer || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Send correct command to child device — webrtc_stream, NOT record_audio
      const cmdData = {
        device_id: params.id,
        command: "webrtc_stream",
        payload: { stream_type: session_type, session_id: data.id },
        status: "pending" as const,
      };
      const { data: cmdRow } = await admin.from("device_commands").insert(cmdData).select().single();

      // Instant Realtime broadcast to phone
      try {
        const channel = admin.channel(`device:${params.id}`);
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 2000);
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              clearTimeout(timeout);
              channel.send({ type: "broadcast", event: "command", payload: cmdRow || cmdData })
                .then(() => resolve()).catch(() => resolve());
            }
          });
        });
        admin.removeChannel(channel);
      } catch (ignored) {}

      return NextResponse.json({ success: true, session: data });
    }

    if (action === "answer") {
      const { session_id } = body;
      await admin
        .from("device_live_sessions")
        .update({ sdp_answer, updated_at: new Date().toISOString() })
        .eq("id", session_id);
      return NextResponse.json({ success: true });
    }

    if (action === "candidate") {
      const { session_id } = body;
      const { data } = await admin
        .from("device_live_sessions")
        .select("ice_candidates")
        .eq("id", session_id)
        .single();

      const list = Array.isArray(data?.ice_candidates) ? data.ice_candidates : [];
      list.push(candidate);

      await admin
        .from("device_live_sessions")
        .update({ ice_candidates: list })
        .eq("id", session_id);

      return NextResponse.json({ success: true });
    }

    if (action === "stop") {
      await admin
        .from("device_live_sessions")
        .update({ status: "ended", updated_at: new Date().toISOString() })
        .eq("device_id", params.id)
        .eq("status", "active");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
