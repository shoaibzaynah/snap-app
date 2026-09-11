// components/admin/devices/DeviceClipboardTab.tsx
"use client";

import React, { useState } from "react";
import { DeviceClipboardItem } from "@/lib/device-telemetry-types";
import { Clipboard, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  items: DeviceClipboardItem[];
  onClearAll?: () => void;
  loading?: boolean;
}

export const DeviceClipboardTab: React.FC<Props> = ({ items, onClearAll, loading }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-white/50">
          Showing {items.length} copied clipboard item(s)
        </p>
        {items.length > 0 && onClearAll && (
          <Button size="sm" variant="secondary" onClick={onClearAll} className="h-8 text-xs text-rose-500 gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading clipboard items...</div>
      ) : items.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
          <Clipboard className="w-8 h-8 text-slate-400 dark:text-white/30 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-white/70">No Clipboard Items</p>
          <p className="text-[11px] text-slate-400 dark:text-white/40 max-w-sm mx-auto">
            Enable Clipboard Monitor in Telemetry Controls to capture text, links, and notes copied on the device.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                  {new Date(item.copied_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
                <p className="font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-black/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 break-all select-all">
                  {item.content}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCopy(item.id, item.content)}
                className="h-8 w-8 p-0 shrink-0 rounded-xl"
              >
                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
