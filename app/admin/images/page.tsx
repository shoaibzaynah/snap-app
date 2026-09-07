// app/admin/images/page.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TargetUrlForm } from "@/components/admin/TargetUrlForm";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { LinkSuccessCard } from "@/components/admin/LinkSuccessCard";
import { Globe, Image as ImageIcon } from "lucide-react";

export default function AdminUploadPage() {
  const [activeTab, setActiveTab] = useState<"url" | "image">("url");
  const [isLoading, setIsLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [createdTargetUrl, setCreatedTargetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create link");
      }

      const { link } = await res.json();
      const shareUrl = `${window.location.origin}/view/${link.slug}`;
      setCreatedLink(shareUrl);
      setCreatedTargetUrl(link.target_url || null);
    } catch (err: any) {
      setError(err.message || "Failed to create link");
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

  const handleReset = () => {
    setCreatedLink(null);
    setCreatedTargetUrl(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Create Tracking Link</h1>
        <p className="text-xs text-white/50">
          Bridge target URLs (YouTube, TikTok, Instagram, etc.) or upload protected snap images
        </p>
      </div>

      {createdLink ? (
        <LinkSuccessCard
          createdLink={createdLink}
          copied={copied}
          onCopy={handleCopy}
          onReset={handleReset}
          targetUrl={createdTargetUrl}
        />
      ) : (
        <Card variant="glass" className="p-6 space-y-6">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#141418] rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "url"
                  ? "bg-[#FFFC00] text-black shadow-lg shadow-yellow-500/10"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Target URL Bridge
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "image"
                  ? "bg-[#FFFC00] text-black shadow-lg shadow-yellow-500/10"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Upload Image Snap
            </button>
          </div>

          {activeTab === "url" ? (
            <TargetUrlForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          ) : (
            <ImageUploadForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          )}
        </Card>
      )}
    </div>
  );
}
