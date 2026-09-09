import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Navigation } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatSocialTitle } from "@/lib/text-utils";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const admin = createAdminClient();

  const { data: sessions, error } = await admin
    .from("location_sessions")
    .select(`
      id,
      status,
      consent_at,
      started_at,
      ended_at,
      image_links ( title ),
      location_updates ( latitude, longitude, created_at )
    `)
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Header: Anti-Clash Single Row */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">Location Sessions</h1>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-white/50">Audit log of all location sessions</p>
      </div>

      {(!sessions || sessions.length === 0) ? (
        <Card variant="glass" className="p-8 text-center text-sm text-slate-500 dark:text-white/50 rounded-2xl border-slate-200 dark:border-white/10">
          No location sessions recorded yet.
        </Card>
      ) : (
        <div className="grid gap-2.5 sm:gap-3">
          {sessions.map((s: any) => {
            const updates = s.location_updates || [];
            const latestUpdate = updates.length > 0 ? updates[updates.length - 1] : null;
            const gmapsUrl = latestUpdate
              ? `https://www.google.com/maps?q=${latestUpdate.latitude},${latestUpdate.longitude}`
              : null;

            return (
              <Card
                key={s.id}
                variant="glass"
                className="p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-slate-200 dark:border-white/10"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {formatSocialTitle(s.image_links?.title)}
                    </span>
                    <Badge variant={s.status === "active" ? "live" : "expired"} className="text-[9px] sm:text-xs px-2 py-0.5">
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50">
                    Started: {formatDate(s.consent_at)} • Updates: {updates.length}
                  </p>
                  {latestUpdate && (
                    <p className="text-[10px] sm:text-xs text-amber-600 dark:text-[#FFFC00] font-mono">
                      Last Coords: {latestUpdate.latitude.toFixed(4)}, {latestUpdate.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {gmapsUrl && (
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start sm:self-center shrink-0"
                  >
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-[#FFFC00] transition-all">
                      <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Google Maps ↗
                    </span>
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
