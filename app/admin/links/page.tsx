"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Copy, Check, Trash2, Power, ExternalLink, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ImageLink } from "@/lib/types";

export default function AdminLinksPage() {
  const [links, setLinks] = useState<ImageLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

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
    const url = `${window.location.origin}/view/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await fetch("/api/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_active: !currentStatus } : l))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this snap link?")) return;
    try {
      await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Share Links</h1>
          <p className="text-xs text-white/50">Manage active links and access permissions</p>
        </div>
        <Button onClick={fetchLinks} variant="secondary" size="sm" className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-white/50">Loading links...</div>
      ) : links.length === 0 ? (
        <Card variant="glass" className="p-8 text-center text-white/50 text-sm">
          No links generated yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map((link) => (
            <Card
              key={link.id}
              variant="glass"
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {link.title || "Untitled Snap"}
                  </h3>
                  <Badge variant={link.is_active ? "active" : "expired"}>
                    {link.is_active ? "Active" : "Paused"}
                  </Badge>
                  {link.requires_location && (
                    <Badge variant="live">Location Req</Badge>
                  )}
                </div>
                <p className="text-xs text-white/50 font-mono">
                  Slug: {link.slug} • Created {formatDate(link.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <Button
                  onClick={() => handleCopy(link.slug)}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                >
                  {copiedSlug === link.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSlug === link.slug ? "Copied" : "Copy"}
                </Button>

                <Button
                  onClick={() => handleToggle(link.id, link.is_active)}
                  variant="ghost"
                  size="sm"
                  title="Toggle Active"
                >
                  <Power className={`w-4 h-4 ${link.is_active ? "text-emerald-400" : "text-zinc-500"}`} />
                </Button>

                <Link href={`/view/${link.slug}`} target="_blank">
                  <Button variant="ghost" size="sm" title="Open in Viewer">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>

                <Button
                  onClick={() => handleDelete(link.id)}
                  variant="danger"
                  size="sm"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
