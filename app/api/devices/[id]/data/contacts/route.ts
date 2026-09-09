// app/api/devices/[id]/data/contacts/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contact_id");

    if (!contactId) {
      const admin = createAdminClient();
      await admin.from("device_contacts").delete().eq("device_id", params.id);
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();
    
    await admin.from("device_contacts").delete().eq("id", contactId).eq("device_id", params.id);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}