// components/admin/TargetUrlForm.tsx
import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { Globe, Sparkles, Search } from "lucide-react";
import { PlatformType, PermissionsConfig } from "@/lib/types";
import { getSafePreviewImageUrl } from "@/lib/utils";

interface TargetUrlFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const TargetUrlForm: React.FC<TargetUrlFormProps> = ({ onSubmit, isLoading, error }) => {
  const [targetUrl, setTargetUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("custom");
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [expiresHours, setExpiresHours] = useState("24");
  const [permissions, setPermissions] = useState<PermissionsConfig>({
    location: true,
    device_info: true,
    camera: false,
  });

  const handleFetchMetadata = async () => {
    if (!targetUrl) return;
    setIsFetchingMeta(true);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (data.metadata) {
        if (data.metadata.title) setTitle(data.metadata.title);
        if (data.metadata.description) setDescription(data.metadata.description);
        if (data.metadata.image) setOgImageUrl(data.metadata.image);
        if (data.metadata.platform) setPlatform(data.metadata.platform);
      }
    } catch (err) {
      console.warn("Failed to fetch metadata:", err);
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("target_url", targetUrl);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("og_title", title);
    formData.append("og_description", description);
    formData.append("og_image_url", ogImageUrl);
    formData.append("og_platform", platform);
    formData.append("requires_location", String(permissions.location));
    formData.append("permissions_config", JSON.stringify(permissions));
    if (expiresHours !== "0") formData.append("expires_in_hours", expiresHours);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span>Destination URL (YouTube, TikTok, Instagram, etc.)</span>
              {platform !== "custom" && (
                <Badge variant="active" className="uppercase text-[10px]">{platform}</Badge>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or instagram.com/..."
                  className="w-full bg-[#141418] border border-white/10 rounded-2xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFFC00]"
                />
              </div>
              <Button
                type="button"
                onClick={handleFetchMetadata}
                isLoading={isFetchingMeta}
                variant="secondary"
                size="sm"
                className="gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                Fetch Info
              </Button>
            </div>
          </div>

          <Input label="Preview Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Must Watch Viral Video" />
          <Input label="Preview Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description for preview card..." />

          <PermissionSelector config={permissions} onChange={setPermissions} />

          <div className="p-3 rounded-2xl bg-[#1C1C22] border border-white/10">
            <label className="text-xs font-bold text-white block mb-1">Link Expiration</label>
            <select
              value={expiresHours}
              onChange={(e) => setExpiresHours(e.target.value)}
              className="w-full bg-transparent text-xs text-white outline-none cursor-pointer"
            >
              <option value="1" className="bg-black">1 Hour</option>
              <option value="24" className="bg-black">24 Hours</option>
              <option value="168" className="bg-black">7 Days</option>
              <option value="0" className="bg-black">Never Expires</option>
            </select>
          </div>

          <Button type="submit" isLoading={isLoading} size="lg" className="w-full mt-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Tracking Link
          </Button>
        </div>

        {/* Right Column: Live Social Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-3xl bg-[#121216] border border-white/10 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
                WhatsApp / Social Preview Card
              </span>
              {platform !== "custom" && (
                <Badge variant="active" className="uppercase text-[10px]">{platform}</Badge>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-lg">
              {ogImageUrl ? (
                <div className="relative w-full aspect-video bg-black">
                  <Image src={getSafePreviewImageUrl(ogImageUrl)} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-full aspect-video bg-white/[0.03] border-b border-white/5 flex flex-col items-center justify-center p-4 text-center">
                  <Globe className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-xs text-white/40">Paste link & click Fetch Info to load social card</p>
                </div>
              )}
              <div className="p-3.5 space-y-1 bg-[#141418]">
                <p className="text-xs font-bold text-white line-clamp-1">{title || "Your Link Title"}</p>
                <p className="text-[11px] text-white/50 line-clamp-2">{description || "Social media preview description will appear here..."}</p>
                <p className="text-[10px] text-[#FFFC00]/80 truncate pt-1 font-mono">{targetUrl || "https://..."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
