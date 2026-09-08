// components/admin/devices/DeviceCallLogsList.tsx
"use client";

import React from "react";
import { DeviceCall } from "@/lib/device-types";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock } from "lucide-react";

interface Props {
  calls: DeviceCall[];
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export const DeviceCallLogsList: React.FC<Props> = ({ calls }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <PhoneIncoming className="w-5 h-5 text-[#FFFC00]" />
          Call History ({calls.length})
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Incoming, outgoing, and missed calls with exact duration and timestamps.
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/50 text-xs">
          No call logs recorded yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.01]">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
            {calls.map((call) => {
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
                      <span>
                        {new Date(call.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(call.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
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
