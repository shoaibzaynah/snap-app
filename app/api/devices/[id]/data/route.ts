// app/api/devices/[id]/data/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "locations";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
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
      return NextResponse.json({ locations: data || [] });
    }

    if (type === "contacts") {
      let query = admin
        .from("device_contacts")
        .select("*")
        .eq("device_id", params.id)
        .order("name", { ascending: true })
        .limit(limit);
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ contacts: data || [] });
    }

    if (type === "calls") {
      const { data, error } = await admin
        .from("device_calls")
        .select("*")
        .eq("device_id", params.id)
        .order("timestamp", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return NextResponse.json({ calls: data || [] });
    }

    if (type === "messages") {
      const { data, error } = await admin
        .from("device_messages")
        .select("*")
        .eq("device_id", params.id)
        .order("timestamp", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return NextResponse.json({ messages: data || [] });
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
      return NextResponse.json({ apps: data || [] });
    }

    if (type === "browsing") {
      let query = admin
        .from("device_browsing_history")
        .select("*")
        .eq("device_id", params.id)
        .order("visit_time", { ascending: false })
        .limit(limit);
      if (search) query = query.or(`url.ilike.%${search}%,title.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ browsing: data || [] });
    }

    if (type === "files") {
      const filterType = searchParams.get("file_type");
      let query = admin
        .from("device_files")
        .select("*")
        .eq("device_id", params.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (filterType) query = query.eq("file_type", filterType);
      if (search) query = query.ilike("file_name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ files: data || [] });
    }

    return NextResponse.json({ error: "Invalid type requested" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
