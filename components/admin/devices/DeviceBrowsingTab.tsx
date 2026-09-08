// components/admin/devices/DeviceBrowsingTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { DeviceBrowsingItem } from "@/lib/device-types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Globe, ExternalLink, Compass, Clock, Search } from "lucide-react";

interface Props {
  deviceId: string;
}

export const DeviceBrowsingTab: React.FC<Props> = ({ deviceId }) => {
  const [history, setHistory] = useState<DeviceBrowsingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBrowsing = async () => {
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/devices/${deviceId}/data?type=browsing${q}`);
      if (res.ok) {
        const json = await res.json();
        setHistory(json.browsing || []);
      }
    } catch (err) {
      console.error("Failed to fetch browsing history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowsing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, search]);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Browser Activity &amp; Visited URLs ({history.length})
          </h3>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search URLs or titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 dark:text-white/50 text-xs">
          No browsing activity recorded yet. Visited sites will capture automatically in real time.
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {history.map((item) => {
            let domain = item.url;
            try {
              domain = new URL(item.url).hostname;
            } catch {}

            return (
              <Card key={item.id} className="p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title || domain}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400 font-semibold">
                        {item.browser_name}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-slate-500 dark:text-white/40 hover:text-amber-600 dark:hover:text-[#FFFC00] truncate block flex items-center gap-1 mt-0.5"
                    >
                      {item.url}
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 dark:text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(item.visit_time)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
