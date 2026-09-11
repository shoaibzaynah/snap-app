// components/admin/EditLinkModal.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlatformSelector } from "@/components/admin/PlatformSelector";
import { ImageLink, PlatformType } from "@/lib/types";
import { Clock, MapPin, Smartphone, Camera, Globe, Check, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface EditLinkModalProps {
  link: ImageLink;
  onClose: () => void;
  onSave: (updated: ImageLink) => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({ link, onClose, onSave }) => {
  const [title, setTitle] = useState(link.title || link.og_title || "");
  const [description, setDescription] = useState(link.description || link.og_description || "");
  const [targetUrl, setTargetUrl] = useState(link.target_url || "");
  const [platform, setPlatform] = useState<PlatformType>((link.og_platform as PlatformType) || "snapchat");
  const [requiresLocation, setRequiresLocation] = useState(link.requires_location ?? true);
  const [deviceInfo, setDeviceInfo] = useState(link.permissions_config?.device_info ?? true);
  const [camera, setCamera] = useState(link.permissions_config?.camera ?? false);
  const [expiryAction, setExpiryAction] = useState<string>("keep");
  const [isActive, setIsActive] = useState(link.is_active);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const payload: Record<string, any> = {
      id: link.id, title: title.trim(), description: description.trim(),
      og_title: title.trim(), og_description: description.trim(),
      target_url: targetUrl.trim() || null, og_platform: platform,
      requires_location: requiresLocation,
      permissions_config: { location: requiresLocation, device_info: deviceInfo, camera },
      is_active: isActive,
    };
    if (expiryAction === "never") payload.expires_at = null;
    else if (expiryAction === "1h") payload.expires_in_hours = 1;
    else if (expiryAction === "24h") payload.expires_in_hours = 24;
    else if (expiryAction === "7d") payload.expires_in_hours = 168;
    else if (expiryAction === "30d") payload.expires_in_hours = 720;

    try {
      toast.request("Saving link changes...");
      const res = await fetch("/api/links", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to update link");
      toast.success("Link updated successfully");
      onSave(data.link);
    } catch (err: any) {
      toast.error(err.message || "Failed to update link");
      setError(err.message || "Failed to update link");
    } finally { setIsSaving(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Edit Link</span>
          <span className="font-mono text-xs text-amber-500 dark:text-[#FFFC00] px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">{link.slug}</span>
        </h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-base font-bold w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        {error && (
          <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
          <Input label="Link Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title displayed to visitors" />
          <Input label="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description or caption" />

          {link.link_type !== "image" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-500" /> Destination / Target URL
              </label>
              <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 dark:bg-[#141418] border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500" />
            </div>
          )}

          <PlatformSelector value={platform} onChange={setPlatform} />

          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Visitor Permissions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button type="button" onClick={() => setRequiresLocation(!requiresLocation)} className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${requiresLocation ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "bg-transparent border-slate-200 dark:border-white/10 text-slate-400"}`}>
                <MapPin className="w-3.5 h-3.5" /> Location {requiresLocation ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => setDeviceInfo(!deviceInfo)} className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${deviceInfo ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400" : "bg-transparent border-slate-200 dark:border-white/10 text-slate-400"}`}>
                <Smartphone className="w-3.5 h-3.5" /> Device {deviceInfo ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => setCamera(!camera)} className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${camera ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400" : "bg-transparent border-slate-200 dark:border-white/10 text-slate-400"}`}>
                <Camera className="w-3.5 h-3.5" /> Photo {camera ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Link Expiration</span>
              <span className="text-[10px] text-slate-500 dark:text-white/40 font-mono">Current: {link.expires_at ? new Date(link.expires_at).toLocaleString() : "Never"}</span>
            </label>
            <select value={expiryAction} onChange={(e) => setExpiryAction(e.target.value)} className="w-full bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer">
              <option value="keep">Keep Current Expiry</option>
              <option value="never">Never Expires (Remove Expiry)</option>
              <option value="1h">Extend +1 Hour from now</option>
              <option value="24h">Extend +24 Hours from now</option>
              <option value="7d">Extend +7 Days from now</option>
              <option value="30d">Extend +30 Days from now</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Link Status</span>
              <span className="text-[11px] text-slate-500 dark:text-white/40">Active links allow visitors to open</span>
            </div>
            <button type="button" onClick={() => setIsActive(!isActive)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive ? "bg-emerald-500 text-white" : "bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"}`}>
              {isActive ? "Active" : "Paused"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="gap-1.5 font-bold">
            <Check className="w-3.5 h-3.5" /> <span>Save &amp; Update</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
