// components/admin/devices/DeviceCallLogsList.tsx
"use client";

import React from "react";
import { DeviceCall } from "@/lib/device-types";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock, Trash2, RefreshCw } from "lucide-react";
import { formatLocalDateTime } from "@/lib/utils";

interface Props {
  calls: DeviceCall[];
  onDeleteCall?: (id: string) => void;
  onSync?: () => void;
  onBulkDelete?: () => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export const DeviceCallLogsList: React.FC<Props> = ({ calls, onDeleteCall, onSync, onBulkDelete }) => {
  const sortedCalls = React.useMemo(() => {
    return [...calls].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [calls]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PhoneIncoming className="w-5 h-5 text-[#FFFC00]" />
            Call History ({calls.length})
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Incoming, outgoing, and missed calls with exact duration and timestamps.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onSync && (
            <button onClick={onSync} className="h-8 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> <span>Sync</span>
            </button>
          )}
          {onBulkDelete && calls.length > 0 && (
            <button onClick={() => { if (confirm("Delete ALL call logs?")) onBulkDelete(); }} className="h-8 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition-all flex items-center gap-1.5 shrink-0" title="Delete All Calls">
              <Trash2 className="w-3.5 h-3.5" /> <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {calls.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/50 text-xs">
          No call logs recorded yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.01]">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
            {sortedCalls.map((call) => {
              const isMissed = call.call_type === "missed" || call.call_type === "rejected";
              const isIncoming = call.call_type === "incoming";

              return (
                <div
                  key={call.id}
                  className="p-3.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isMissed
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : isIncoming
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {call.call_type === "incoming" && <PhoneIncoming className="w-4 h-4" />}
                      {call.call_type === "outgoing" && <PhoneOutgoing className="w-4 h-4" />}
                      {call.call_type === "missed" && <PhoneMissed className="w-4 h-4" />}
                      {call.call_type === "rejected" && <PhoneOff className="w-4 h-4" />}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {call.contact_name || call.phone_number}
                      </h4>
                      {call.contact_name && (
                        <p className="text-[11px] font-mono text-white/50 mt-0.5">
                          {call.phone_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold capitalize ${
                          isMissed ? "text-red-400" : "text-white/80"
                        }`}
                      >
                        {call.call_type} &bull; {formatDuration(call.duration_seconds)}
                      </span>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-white/40 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatLocalDateTime(call.timestamp)}</span>
                      </div>
                    </div>
                    {onDeleteCall && (
                      <button
                        onClick={() => { if (confirm("Delete this call log?")) onDeleteCall!(call.id); }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/80 text-white/70 hover:text-white transition-all border border-white/10"
                        title="Delete Call Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};