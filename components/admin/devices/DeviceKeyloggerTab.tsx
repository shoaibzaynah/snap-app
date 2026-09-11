// components/admin/devices/DeviceKeyloggerTab.tsx
"use client";

import React, { useState } from "react";
import { DeviceKeystroke } from "@/lib/device-telemetry-types";
import { Keyboard, Trash2, Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  keystrokes: DeviceKeystroke[];
  onClearAll?: () => void;
  loading?: boolean;
}

export const DeviceKeyloggerTab: React.FC<Props> = ({ keystrokes, onClearAll, loading }) => {
  const [search, setSearch] = useState("");

  const filtered = keystrokes.filter(
    (k) =>
      k.text?.toLowerCase().includes(search.toLowerCase()) ||
      k.app_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Search typed text or app..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-amber-500"
        />
        {keystrokes.length > 0 && onClearAll && (
          <Button size="sm" variant="secondary" onClick={onClearAll} className="h-8 text-xs text-rose-500 gap-1 shrink-0">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading keystroke stream...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
          <Keyboard className="w-8 h-8 text-slate-400 dark:text-white/30 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-white/70">No Keystrokes Logged</p>
          <p className="text-[11px] text-slate-400 dark:text-white/40 max-w-sm mx-auto">
            Enable Keylogger in Telemetry Controls to capture text inputs, searches, and chat messages.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((k) => (
            <div
              key={k.id}
              className="bg-white dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 font-mono">
                  <Smartphone className="w-3 h-3" />
                  {k.app_name || "App"}
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                  {new Date(k.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <p className="font-mono text-slate-900 dark:text-white text-xs bg-slate-50 dark:bg-black/30 p-2 rounded-xl border border-slate-200/60 dark:border-white/5 whitespace-pre-wrap break-words">
                {k.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
