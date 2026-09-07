"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadCloud, Check, Copy, MapPin, Sparkles } from "lucide-react";

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiresLocation, setRequiresLocation] = useState(true);
  const [expiresHours, setExpiresHours] = useState("24");
  const [isLoading, setIsLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size exceeds maximum 10MB limit");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image to upload");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("requires_location", String(requiresLocation));
      if (expiresHours !== "0") {
        formData.append("expires_in_hours", expiresHours);
      }

      const res = await fetch("/api/links", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create snap link");
      }

      const { link } = await res.json();
      const shareUrl = `${window.location.origin}/view/${link.slug}`;
      setCreatedLink(shareUrl);
    } catch (err: any) {
      setError(err.message || "Failed to create snap");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Upload & Share Snap</h1>
        <p className="text-xs text-white/50">Upload an image and generate a protected Snapchat-style share link</p>
      </div>

      {createdLink ? (
        <Card variant="glow" className="p-8 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-[#FFFC00] mx-auto flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/20">
            👻
          </div>
          <h2 className="text-xl font-bold text-white">Snap Link Ready!</h2>
          <p className="text-xs text-white/60">Share this native link with your recipient</p>

          <div className="flex items-center gap-2 p-2 bg-[#1C1C22] rounded-2xl border border-white/10">
            <input
              readOnly
              value={createdLink}
              className="flex-1 bg-transparent px-3 text-xs text-[#FFFC00] font-mono outline-none"
            />
            <Button onClick={handleCopy} size="sm" className="gap-1.5 shrink-0">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <a href={createdLink} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">Open Link ↗</Button>
            </a>
            <Button onClick={() => { setCreatedLink(null); setFile(null); setPreview(null); }} size="sm">
              Create Another
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="glass" className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-300">{error}</div>}

            {/* Drag & Drop / File Input */}
            <div className="relative border-2 border-dashed border-white/15 hover:border-[#FFFC00]/50 rounded-3xl p-6 text-center cursor-pointer transition-all bg-white/[0.02]">
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#1C1C22] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FFFC00]" />
                  <div>
                    <p className="text-xs font-bold text-white">Require Location</p>
                    <p className="text-[10px] text-white/50">Mandatory consent to view</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requiresLocation}
                  onChange={(e) => setRequiresLocation(e.target.checked)}
                  className="w-5 h-5 accent-[#FFFC00] rounded cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#1C1C22] border border-white/10">
                <label className="text-xs font-bold text-white block mb-1.5">Expiration</label>
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
            </div>

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Snap Link
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
