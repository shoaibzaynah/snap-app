// app/api/devices/[id]/data/notifications/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: notifications, error } = await admin
      .from("device_notifications")
      .select("*")
      .eq("device_id", params.id)
      .order("post_time", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ notifications: notifications || [] });
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
    const { package_name, app_name, title, text, post_time } = body;

    if (!package_name || (!title && !text)) {
      return NextResponse.json({ error: "Missing required notification fields" }, { status: 400 });
    }

    const admin = createAdminClient();
    const postTimeIso = post_time ? new Date(Number(post_time)).toISOString() : new Date().toISOString();

    const { data, error } = await admin
      .from("device_notifications")
      .insert({
        device_id: params.id,
        package_name,
        app_name: app_name || package_name,
        title: title || "",
        text: text || "",
        post_time: postTimeIso,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, notification: data });
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
      .from("device_notifications")
      .delete()
      .eq("device_id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
