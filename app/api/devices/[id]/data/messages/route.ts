// app/api/devices/[id]/data/messages/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("message_id");

    if (!messageId) {
      // Bulk delete all messages for this device
      const admin = createAdminClient();
      await admin.from("device_messages").delete().eq("device_id", params.id);
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();
    await admin.from("device_messages").delete().eq("id", messageId).eq("device_id", params.id);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}