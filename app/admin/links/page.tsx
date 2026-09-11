// app/admin/links/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import { ImageLink } from "@/lib/types";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EditLinkModal } from "@/components/admin/EditLinkModal";
import { PhotoLightboxModal } from "@/components/admin/PhotoLightboxModal";
import { LinkCardItem } from "@/components/admin/LinkCardItem";
import { toast } from "@/components/ui/Toast";

export default function AdminLinksPage() {
  const [links, setLinks] = useState<ImageLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<ImageLink | null>(null);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    url: null,
    title: "",
  });

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopy = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/view/${slug}`);
    setCopiedSlug(slug);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (res.ok) {
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: !currentStatus } : l)));
        toast.success(!currentStatus ? "Link activated" : "Link paused");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link? All associated sessions will also be deleted.")) return;
    try {
      await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Link deleted");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between gap-2 w-full">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate min-w-0">
            Tracking &amp; Share Links
          </h1>
          <Button
            onClick={fetchLinks}
            variant="secondary"
            size="sm"
            className="h-7 sm:h-8 md:h-9 px-2.5 sm:px-3.5 rounded-full border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:border-[#FFFC00]/50 shrink-0 gap-1 sm:gap-1.5 font-bold text-[10px] sm:text-xs"
          >
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-white/50">
          Manage individual links and view dedicated telemetry per link
        </p>
      </div>

      {isLoading ? (
        <TableRowSkeleton rows={5} />
      ) : links.length === 0 ? (
        <Card variant="glass" className="p-8 text-center text-slate-500 dark:text-white/50 text-sm rounded-2xl border-slate-200 dark:border-white/10">
          No tracking links generated yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map((link) => (
            <LinkCardItem
              key={link.id}
              link={link}
              copiedSlug={copiedSlug}
              onCopy={handleCopy}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={setEditingLink}
              onPreviewThumbnail={(url, title, subtitle) =>
                setLightbox({ isOpen: true, url, title, subtitle })
              }
            />
          ))}
        </div>
      )}

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSave={(updated) => {
            setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setEditingLink(null);
          }}
        />
      )}

      {lightbox.isOpen && (
        <PhotoLightboxModal
          isOpen={lightbox.isOpen}
          onClose={() => setLightbox({ isOpen: false, url: null, title: "" })}
          photoUrl={lightbox.url}
          title={lightbox.title}
          subtitle={lightbox.subtitle ? `Slug: ${lightbox.subtitle}` : undefined}
        />
      )}
    </div>
  );
}
