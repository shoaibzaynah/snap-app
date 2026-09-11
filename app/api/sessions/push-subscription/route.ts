// app/api/sessions/push-subscription/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrGenerateVapidKeys } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keys = await getOrGenerateVapidKeys();
    return NextResponse.json({ publicKey: keys.publicKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, subscription } = body;

    if (!sessionId || !subscription) {
      return NextResponse.json({ error: "sessionId and subscription required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("location_sessions")
      .update({
        push_subscription: subscription,
      })
      .eq("id", sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
