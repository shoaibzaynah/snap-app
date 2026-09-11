// app/api/devices/[id]/data/clipboard/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: clipboard, error } = await admin
      .from("device_clipboard")
      .select("*")
      .eq("device_id", params.id)
      .order("copied_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ clipboard: clipboard || [] });
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
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Empty clipboard content" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("device_clipboard")
      .insert({
        device_id: params.id,
        content: content.trim(),
        copied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, item: data });
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
      .from("device_clipboard")
      .delete()
      .eq("device_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
