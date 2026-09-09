// components/admin/devices/DeviceMessagesFeed.tsx
"use client";

import React, { useState, useMemo } from "react";
import { DeviceMessage } from "@/lib/device-types";
import { Input } from "@/components/ui/Input";
import { MessageSquare, Search, ArrowDownLeft, ArrowUpRight, Clock, KeyRound, Trash2 } from "lucide-react";
import { formatLocalTime } from "@/lib/utils";

interface Props {
  messages: DeviceMessage[];
  onDeleteMessage?: (id: string) => void;
}

export const DeviceMessagesFeed: React.FC<Props> = ({ messages, onDeleteMessage }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = !search.trim()
      ? messages
      : messages.filter(
          (m) =>
            m.body.toLowerCase().includes(search.toLowerCase()) ||
            m.sender.toLowerCase().includes(search.toLowerCase())
        );
    return [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#FFFC00]" />
            SMS Messages ({messages.length})
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Incoming and sent SMS text messages, including 2FA OTP codes.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search text or sender..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/50 text-xs">
          {messages.length === 0
            ? "No SMS messages recorded yet."
            : "No messages match your search."}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((msg) => {
            const isSent = msg.message_type === "sent";
            const isOtp = /\b\d{4,8}\b/.test(msg.body) && /code|otp|verify|login|pin/i.test(msg.body);

            return (
              <div
                key={msg.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        isSent
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {isSent ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Sent
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-3 h-3" /> Received
                        </>
                      )}
                    </span>
                    <strong className="text-xs text-white font-mono">{msg.sender}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOtp && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FFFC00]/10 border border-[#FFFC00]/20 text-[#FFFC00] text-[10px] font-bold flex items-center gap-1">
                        <KeyRound className="w-3 h-3" /> OTP Alert
                      </span>
                    )}
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatLocalTime(msg.timestamp)}
                    </span>
                    {onDeleteMessage && (
                      <button
                        onClick={() => { if (confirm("Delete this message?")) onDeleteMessage!(msg.id); }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/80 text-white/70 hover:text-white transition-all border border-white/10"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-white/80 leading-relaxed font-sans select-text">
                  {msg.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};