import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Navigation } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
      <div>
        <h1 className="text-2xl font-black text-white">Location Sessions</h1>
        <p className="text-xs text-white/50">Audit log of all location sessions</p>
      </div>

      {(!sessions || sessions.length === 0) ? (
        <Card variant="glass" className="p-8 text-center text-sm text-white/50">
          No location sessions recorded yet.
        </Card>
      ) : (
        <div className="grid gap-3">
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
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {s.image_links?.title || "Untitled Snap"}
                    </span>
                    <Badge variant={s.status === "active" ? "live" : "expired"}>
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/50">
                    Started: {formatDate(s.consent_at)} • Updates: {updates.length}
                  </p>
                  {latestUpdate && (
                    <p className="text-xs text-[#FFFC00] font-mono">
                      Last Coords: {latestUpdate.latitude.toFixed(4)}, {latestUpdate.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {gmapsUrl && (
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-end sm:self-center"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#FFFC00] transition-all">
                      <Navigation className="w-3.5 h-3.5" />
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
