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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Operations <span className="text-[#FFFC00]">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Real-time telemetry, snap links, and consented geolocation monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/images">
            <Button size="md" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              New Snap
            </Button>
          </Link>
          <Link href="/admin/locations">
            <Button variant="secondary" size="md" className="gap-2">
              <MapPin className="w-4 h-4 text-[#FFFC00]" />
              Live Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} variant="glass" className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  {stat.label}
                </span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Snaps List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FFFC00]" />
            Recent Snap Links
          </h2>
          <Link href="/admin/links" className="text-xs text-[#FFFC00] hover:underline font-semibold">
            View All ({totalLinks}) →
          </Link>
        </div>

        {links.length === 0 ? (
          <Card variant="glass" className="p-8 text-center text-white/50 text-sm">
            No snap links created yet. Click "New Snap" above to upload your first image!
          </Card>
        ) : (
          <div className="grid gap-3">
            {links.slice(0, 5).map((link) => (
              <Card
                key={link.id}
                variant="glass"
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1C22] flex items-center justify-center text-lg">
                    👻
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                      {link.title || "Untitled Snap"}
                    </h3>
                    <p className="text-xs text-white/50">
                      Created {formatDate(link.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge variant={link.is_active ? "active" : "expired"}>
                    {link.is_active ? "Active" : "Paused"}
                  </Badge>
                  {link.requires_location && (
                    <Badge variant="live">Location Protected</Badge>
                  )}
                  <Link href={`/view/${link.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">
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
