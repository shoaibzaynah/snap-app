// app/api/admin/live-locations/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeHtml } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = createAdminClient();

    // Query all sessions with telemetry and link info in parallel
    const [sessionsRes, linksRes] = await Promise.all([
      admin
        .from("location_sessions")
        .select(`
          id,
          link_id,
          status,
          started_at,
          consent_at,
          ip_address,
          user_agent,
          device_info,
          image_links ( id, title, slug, target_url, og_platform, link_type ),
          location_updates (
            latitude,
            longitude,
            accuracy,
            created_at
          )
        `)
        .order("consent_at", { ascending: false }),
      admin
        .from("image_links")
        .select(`
          id,
          title,
          slug,
          target_url,
          og_platform,
          is_active,
          created_at,
          location_sessions ( id, status, consent_at )
        `)
        .order("created_at", { ascending: false }),
    ]);

    if (sessionsRes.error) throw sessionsRes.error;
    if (linksRes.error) throw linksRes.error;

    // Process individual visitor locations
    const locations = (sessionsRes.data || [])
      .map((s: any) => {
        const updates = s.location_updates || [];
        if (updates.length === 0) return null;

        updates.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latest = updates[0];
        const link = s.image_links || {};

        return {
          sessionId: s.id,
          linkId: s.link_id,
          linkTitle: decodeHtml(link.title) || "Untitled Link",
          linkSlug: link.slug || "",
          targetUrl: link.target_url || null,
          ogPlatform: link.og_platform || "custom",
          ipAddress: s.ip_address || "Unknown IP",
          deviceInfo: s.device_info || {},
          latitude: latest.latitude,
          longitude: latest.longitude,
          accuracy: latest.accuracy,
          updatedAt: latest.created_at,
          status: s.status,
        };
      })
      .filter(Boolean);

    // Process link summary with visitor counts (har ek link ke apne apne)
    const linksSummary = (linksRes.data || []).map((l: any) => {
      const allSessions = l.location_sessions || [];
      const activeSessions = allSessions.filter((s: any) => s.status === "active");

      return {
        id: l.id,
        title: decodeHtml(l.title) || "Untitled Link",
        slug: l.slug,
        targetUrl: l.target_url || null,
        ogPlatform: l.og_platform || "custom",
        isActive: l.is_active,
        totalVisitors: allSessions.length,
        activeVisitors: activeSessions.length,
        createdAt: l.created_at,
      };
    });

    return NextResponse.json({
      locations,
      linksSummary,
      totalVisitors: sessionsRes.data?.length || 0,
      activeLocationsCount: locations.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
