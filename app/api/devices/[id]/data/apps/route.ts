// app/api/devices/[id]/data/apps/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("app_id");

    if (!appId) {
      // Bulk delete all apps for this device
      const admin = createAdminClient();
      await admin.from("device_installed_apps").delete().eq("device_id", params.id);
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();
    await admin.from("device_installed_apps").delete().eq("id", appId).eq("device_id", params.id);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}