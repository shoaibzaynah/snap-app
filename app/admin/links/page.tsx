// app/admin/links/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Copy, Check, Trash2, Power, ExternalLink, RefreshCw, Globe, Image as ImageIcon, BarChart2 } from "lucide-react";
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
    if (!confirm("Are you sure you want to delete this link? All associated sessions will also be deleted.")) return;
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
          <h1 className="text-2xl font-black text-white">Tracking & Share Links</h1>
          <p className="text-xs text-white/50">Manage individual links and view dedicated telemetry per link</p>
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
          No tracking links generated yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map((link) => {
            const sessionCount = link.location_sessions?.length || 0;
            return (
              <Card
                key={link.id}
                variant="glass"
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {link.title || "Untitled Link"}
                    </h3>
                    <Badge variant={link.is_active ? "active" : "expired"}>
                      {link.is_active ? "Active" : "Paused"}
                    </Badge>
                    {link.og_platform && link.og_platform !== "custom" && (
                      <Badge variant="default" className="uppercase text-[10px] bg-white/10 text-[#FFFC00]">
                        {link.og_platform}
                      </Badge>
                    )}
                    {link.link_type === "redirect" ? (
                      <Badge variant="default" className="text-[10px] gap-1">
                        <Globe className="w-2.5 h-2.5" /> Redirect
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] gap-1">
                        <ImageIcon className="w-2.5 h-2.5" /> Snap
                      </Badge>
                    )}
                    <Badge variant="default" className="text-[10px] bg-[#FFFC00]/10 text-[#FFFC00] border-[#FFFC00]/30">
                      {sessionCount} {sessionCount === 1 ? "Visitor" : "Visitors"}
                    </Badge>
                  </div>

                  {link.target_url && (
                    <p className="text-xs text-white/70 font-mono flex items-center gap-1.5 truncate">
                      <Globe className="w-3 h-3 text-[#FFFC00] shrink-0" />
                      <span className="truncate">{link.target_url}</span>
                    </p>
                  )}

                  <p className="text-xs text-white/40 font-mono">
                    Slug: {link.slug} • Created {formatDate(link.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  <Link href={`/admin/links/${link.id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-black" />
                      Track Link
                    </Button>
                  </Link>

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
            );
          })}
        </div>
      )}
    </div>
  );
}
