import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkDetailMap } from "@/components/admin/LinkDetailMap";
import { VisitorSessionCard } from "@/components/admin/VisitorSessionCard";
import { ArrowLeft, Globe, ExternalLink, Users, MapPin, Eye } from "lucide-react";
import { ImageLink, LocationSession } from "@/lib/types";

interface PageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLinkTrackingPage({ params }: PageProps) {
  const admin = createAdminClient();

  const { data: linkData, error } = await admin
    .from("image_links")
    .select(`
      *,
      location_sessions(
        *,
        location_updates(*)
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !linkData) {
    notFound();
  }

  const link = linkData as ImageLink & { location_sessions: LocationSession[] };
  const sessions = (link.location_sessions || []).sort(
    (a, b) => new Date(b.consent_at).getTime() - new Date(a.consent_at).getTime()
  );

  // Extract coordinates for this link's map
  const mapCoordinates = sessions
    .filter((s) => s.location_updates && s.location_updates.length > 0)
    .map((s) => {
      const latest = s.location_updates![s.location_updates!.length - 1];
      return {
        latitude: latest.latitude,
        longitude: latest.longitude,
        accuracy: latest.accuracy || undefined,
        title: `Visitor IP: ${s.ip_address || "Unknown"}`,
        timestamp: latest.created_at,
      };
    });

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const perm = link.permissions_config;

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/links" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Links
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-white">{link.title || "Untitled Link"}</h1>
            <Badge variant={link.is_active ? "active" : "expired"}>
              {link.is_active ? "Active" : "Paused"}
            </Badge>
          </div>
          {link.target_url && (
            <a
              href={link.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#FFFC00] hover:underline flex items-center gap-1 font-mono"
            >
              <Globe className="w-3 h-3" />
              {link.target_url}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/view/${link.slug}`} target="_blank">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Open Viewer
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Users className="w-4 h-4 text-[#FFFC00]" />
            <span>Total Visitors</span>
          </div>
          <p className="text-2xl font-black text-white">{totalSessions}</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Locations Captured</span>
          </div>
          <p className="text-2xl font-black text-white">{mapCoordinates.length}</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <span className="text-[#FFFC00]">⚙️</span>
            <span>Requested Modules</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {perm?.location && <Badge variant="live" className="text-[10px]">GPS</Badge>}
            {perm?.device_info && <Badge variant="default" className="text-[10px]">Device</Badge>}
            {perm?.camera && <Badge variant="default" className="text-[10px]">Camera</Badge>}
            {perm?.contacts && <Badge variant="default" className="text-[10px]">Contacts</Badge>}
          </div>
        </Card>
      </div>

      {/* Dedicated Map for this link */}
      <div className="space-y-2">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FFFC00]" />
          Visitor Map ({mapCoordinates.length} pins)
        </h2>
        <LinkDetailMap coordinates={mapCoordinates} />
      </div>

      {/* Visitor Sessions List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#FFFC00]" />
          Visitor Telemetry Logs ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <Card variant="glass" className="p-8 text-center text-white/50 text-xs">
            No visitors have opened this link yet. Share the link to begin tracking!
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <VisitorSessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
