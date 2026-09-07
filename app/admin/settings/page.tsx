import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Settings, ShieldCheck, Database, MapPin, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const adminEmail = process.env.ADMIN_EMAIL || "shoaibzaynah@gmail.com";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "Connected";
  const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO || "https://github.com/shoaibzaynah/snap-app";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">System Settings</h1>
        <p className="text-xs text-white/50">Infrastructure configuration, security posture, and API telemetry</p>
      </div>

      <div className="grid gap-4">
        {/* Administrator Identity */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#FFFC00]" />
              <div>
                <h3 className="text-sm font-bold text-white">Designated Administrator</h3>
                <p className="text-xs text-white/50">Primary authorized identity for operations center</p>
              </div>
            </div>
            <Badge variant="active">Active</Badge>
          </div>
          <div className="p-3 bg-[#1C1C22] rounded-2xl border border-white/10 font-mono text-xs text-[#FFFC00]">
            {adminEmail}
          </div>
        </Card>

        {/* Database & Storage */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Supabase Cloud (ap-south-1)</h3>
                <p className="text-xs text-white/50">Postgres database, snap-images bucket, and Realtime pub/sub</p>
              </div>
            </div>
            <Badge variant="live">Connected</Badge>
          </div>
          <div className="space-y-2 text-xs font-mono text-white/70">
            <p>Bucket: <span className="text-white">snap-images</span> (Public Read, Admin Write)</p>
            <p>Region: <span className="text-white">ap-south-1 (Mumbai, India)</span></p>
            <p className="truncate">URL: <span className="text-white">{supabaseUrl}</span></p>
          </div>
        </Card>

        {/* Map Telemetry Engine */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#FFFC00]" />
              <div>
                <h3 className="text-sm font-bold text-white">Live Mapping Engine</h3>
                <p className="text-xs text-white/50">OpenStreetMap (Leaflet dark tiles) + 1-Click Google Maps redirection</p>
              </div>
            </div>
            <Badge variant="active">Zero-Key OSM</Badge>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Free, privacy-friendly OpenStreetMap Leaflet layer rendered with high-contrast dark tiles. Direct 1-click external navigation links redirect to Google Maps coordinates without requiring Google Cloud billing or API keys.
          </p>
        </Card>

        {/* Git Repository */}
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white">GitHub Repository</h3>
                <p className="text-xs text-white/50">Source repository synchronized with main branch</p>
              </div>
            </div>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer">
              <span className="text-xs text-[#FFFC00] hover:underline font-semibold">Open Repo ↗</span>
            </a>
          </div>
          <p className="text-xs font-mono text-white/60 truncate">{repoUrl}</p>
        </Card>
      </div>
    </div>
  );
}
