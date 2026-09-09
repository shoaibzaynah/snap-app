// app/api/devices/[id]/commands/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: commands, error } = await admin
      .from("device_commands")
      .select("*")
      .eq("device_id", params.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json({ commands });
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
    const command = body.command;

    const validCommands = [
      "ring_siren",
      "take_photo",
      "record_audio",
      "sync_apps",
      "sync_contacts",
      "sync_calls",
      "sync_messages",
      "update_location",
      "fetch_location",
    ];

    if (!validCommands.includes(command)) {
      return NextResponse.json(
        { error: `Invalid command. Allowed: ${validCommands.join(", ")}` },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("device_commands")
      .insert({
        device_id: params.id,
        command,
        payload: body.payload || {},
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ command: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const commandId = searchParams.get("command_id");

    if (!commandId) {
      return NextResponse.json({ error: "command_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: cmd } = await admin
      .from("device_commands")
      .select("result_media_path")
      .eq("id", commandId)
      .eq("device_id", params.id)
      .single();

    if (cmd && cmd.result_media_path) {
      await admin.storage.from("snap-images").remove([cmd.result_media_path]);
    }

    await admin.from("device_commands").delete().eq("id", commandId).eq("device_id", params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

