import React from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Image as ImageIcon,
  Link2,
  MapPin,
  Clock,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatSocialTitle } from "@/lib/text-utils";
import { InstallPwaBanner } from "@/components/admin/InstallPwaBanner";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  // Fetch metrics in parallel
  const [linksRes, sessionsRes, updatesRes] = await Promise.all([
    admin.from("image_links").select("id, title, slug, is_active, created_at, requires_location", { count: "exact" }),
    admin.from("location_sessions").select("id, status, consent_at, image_links(title)", { count: "exact" }),
    admin.from("location_updates").select("id", { count: "exact", head: true }),
  ]);

  const links = linksRes.data || [];
  const totalLinks = linksRes.count || 0;
  const activeLinks = links.filter((l) => l.is_active).length;
  const totalSessions = sessionsRes.count || 0;
  const activeSessions = (sessionsRes.data || []).filter((s) => s.status === "active").length;
  const totalUpdates = updatesRes.count || 0;

  const STATS = [
    { label: "Total Snaps", value: totalLinks, icon: ImageIcon, color: "text-[#FFFC00]" },
    { label: "Active Links", value: activeLinks, icon: Link2, color: "text-emerald-400" },
    { label: "Active Sessions", value: activeSessions, icon: Clock, color: "text-[#FFFC00]" },
    { label: "Location Updates", value: totalUpdates, icon: MapPin, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* PWA Home Screen Installation Prompt on Mobile */}
      <InstallPwaBanner />
      {/* Header: Anti-Clash Single Row with Responsive Width Buttons */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between gap-2 w-full">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate min-w-0">
            Operations <span className="text-amber-600 dark:text-[#FFFC00]">Dashboard</span>
          </h1>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link href="/admin/images">
              <Button size="sm" className="h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4 rounded-full font-bold gap-1 sm:gap-1.5 shadow-lg shadow-yellow-500/20 text-[10px] sm:text-xs">
                <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline sm:hidden">Snap</span>
                <span className="hidden sm:inline">New Snap</span>
              </Button>
            </Link>
            <Link href="/admin/locations">
              <Button variant="secondary" size="sm" className="h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4 rounded-full font-bold gap-1 sm:gap-1.5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-[10px] sm:text-xs">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-[#FFFC00]" />
                <span className="hidden xs:inline sm:hidden">Map</span>
                <span className="hidden sm:inline">Live Map</span>
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-white/60">
          Real-time telemetry, snap links, and geolocation monitoring
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} variant="glass" className="p-3 sm:p-5 rounded-2xl border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider truncate">
                  {stat.label}
                </span>
                <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${stat.color} shrink-0`} />
              </div>
              <p className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Snaps List */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-[#FFFC00]" />
            Recent Snap Links
          </h2>
          <Link href="/admin/links" className="text-xs text-amber-600 dark:text-[#FFFC00] hover:underline font-semibold">
            View All ({totalLinks}) →
          </Link>
        </div>

        {links.length === 0 ? (
          <Card variant="glass" className="p-8 text-center text-slate-500 dark:text-white/50 text-sm rounded-2xl border-slate-200 dark:border-white/10">
            No tracking links created yet. Click &quot;New Snap&quot; above to create your first link!
          </Card>
        ) : (
          <div className="grid gap-2.5 sm:gap-3">
            {links.slice(0, 5).map((link) => (
              <Card
                key={link.id}
                variant="glass"
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border-slate-200 dark:border-white/10"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-[#1C1C22] flex items-center justify-center text-base sm:text-lg shrink-0">
                    👻
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formatSocialTitle(link.title)}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50">
                      Created {formatDate(link.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-center shrink-0 flex-wrap">
                  <Badge variant={link.is_active ? "active" : "expired"} className="text-[9px] sm:text-xs px-2 py-0.5">
                    {link.is_active ? "Active" : "Paused"}
                  </Badge>
                  {link.requires_location && (
                    <Badge variant="live" className="text-[9px] sm:text-xs px-2 py-0.5">
                      <span className="sm:hidden">Protected</span>
                      <span className="hidden sm:inline">Location Protected</span>
                    </Badge>
                  )}
                  <Link href={`/view/${link.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" className="h-6 sm:h-7 px-2 text-[10px] sm:text-xs text-slate-700 dark:text-white/80">
                      View ↗
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
