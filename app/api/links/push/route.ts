// app/api/links/push/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushNotification } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkId, sessionId, title, body: messageBody } = body;

    if (!linkId || !title) {
      return NextResponse.json({ error: "linkId and title are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch link details for destination URL
    const { data: link, error: linkErr } = await admin
      .from("image_links")
      .select("id, slug, title")
      .eq("id", linkId)
      .single();

    if (linkErr || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    let query = admin
      .from("location_sessions")
      .select("id, visitor_token, push_subscription")
      .eq("link_id", linkId)
      .not("push_subscription", "is", null);

    if (sessionId) {
      query = query.eq("id", sessionId);
    }

    const { data: sessions, error: sessErr } = await query;
    if (sessErr || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: "No active push subscribers found for this target" }, { status: 404 });
    }

    const results = await Promise.allSettled(
      sessions.map(async (s) => {
        const sub = s.push_subscription as any;
        if (!sub?.endpoint) return;
        const targetUrl = `/view/${link.slug}?ref=push&token=${s.visitor_token || s.id}`;
        return sendWebPushNotification(sub, {
          title: title.trim(),
          body: (messageBody || "Tap to view update").trim(),
          url: targetUrl,
        });
      })
    );

    const sentCount = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ success: true, sentCount, totalTargets: sessions.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
