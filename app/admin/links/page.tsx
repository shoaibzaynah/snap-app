// app/admin/links/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Copy, Check, Trash2, Power, ExternalLink, RefreshCw, Globe, Image as ImageIcon, BarChart2, Clock, Pencil } from "lucide-react";
import { formatDate, decodeHtml } from "@/lib/utils";
import { formatSocialTitle } from "@/lib/text-utils";
import { ImageLink } from "@/lib/types";
import { getLinkStatusDetails } from "@/lib/link-utils";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EditLinkModal } from "@/components/admin/EditLinkModal";

export default function AdminLinksPage() {
  const [links, setLinks] = useState<ImageLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<ImageLink | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleCopy = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/view/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/links", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_active: !currentStatus }) });
      if (res.ok) setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: !currentStatus } : l)));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link? All associated sessions will also be deleted.")) return;
    try {
      await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between gap-2 w-full">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate min-w-0">Tracking &amp; Share Links</h1>
          <Button onClick={fetchLinks} variant="secondary" size="sm" className="h-7 sm:h-8 md:h-9 px-2.5 sm:px-3.5 rounded-full border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:border-[#FFFC00]/50 shrink-0 gap-1 sm:gap-1.5 font-bold text-[10px] sm:text-xs">
            <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-white/50">Manage individual links and view dedicated telemetry per link</p>
      </div>

      {isLoading ? (
        <TableRowSkeleton rows={5} />
      ) : links.length === 0 ? (
        <Card variant="glass" className="p-8 text-center text-slate-500 dark:text-white/50 text-sm rounded-2xl border-slate-200 dark:border-white/10">
          No tracking links generated yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map((link) => {
            const sessionCount = link.location_sessions?.length || 0;
            const statusInfo = getLinkStatusDetails(link);
            return (
              <Card key={link.id} variant="glass" className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 overflow-hidden rounded-2xl border-slate-200 dark:border-white/10">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-full">
                      {formatSocialTitle(decodeHtml(link.title))}
                    </h3>
                    <Badge variant={statusInfo.badgeVariant}>{statusInfo.badgeLabel}</Badge>
                    {link.og_platform && link.og_platform !== "custom" && (
                      <Badge variant="default" className="uppercase text-[10px] bg-white/10 text-[#FFFC00]">{link.og_platform}</Badge>
                    )}
                    {link.link_type === "redirect" ? (
                      <Badge variant="default" className="text-[10px] gap-1"><Globe className="w-2.5 h-2.5" /> Redirect</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] gap-1"><ImageIcon className="w-2.5 h-2.5" /> Snap</Badge>
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

                  <p className="text-xs text-white/40 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 truncate">
                    <span>Slug: {link.slug}</span>
                    <span>&bull;</span>
                    <span>Created {formatDate(link.created_at)}</span>
                    <span>&bull;</span>
                    <span className={`inline-flex items-center gap-1 ${statusInfo.isExpired ? "text-rose-400 font-bold" : statusInfo.expiresAtFormatted ? "text-amber-300" : "text-white/40"}`}>
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{statusInfo.timeRemainingText}</span>
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 w-full xl:w-auto justify-between sm:justify-end pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-200/60 dark:border-white/5 shrink-0">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                    <Link href={`/admin/links/${link.id}`} className="flex-1 sm:flex-initial">
                      <Button variant="primary" size="sm" className="w-full sm:w-auto gap-1.5 text-xs px-3 h-8 font-bold">
                        <BarChart2 className="w-3.5 h-3.5 text-black" />
                        <span>Track</span>
                      </Button>
                    </Link>
                    <Button onClick={() => handleCopy(link.slug)} variant="secondary" size="sm" className="gap-1 text-xs px-2.5 h-8 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-semibold">
                      {copiedSlug === link.slug ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSlug === link.slug ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button onClick={() => setEditingLink(link)} variant="ghost" size="sm" title="Edit Link" className="w-8 h-8 p-0 rounded-xl text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button onClick={() => handleToggle(link.id, link.is_active)} variant="ghost" size="sm" title={link.is_active ? "Pause Link" : "Resume Link"} className="w-8 h-8 p-0 rounded-xl">
                      <Power className={`w-3.5 h-3.5 ${link.is_active ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                    </Button>
                    <Link href={`/view/${link.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" title="Open in Viewer" className="w-8 h-8 p-0 rounded-xl text-slate-700 dark:text-white/80">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button onClick={() => handleDelete(link.id)} variant="danger" size="sm" title="Delete" className="w-8 h-8 p-0 rounded-xl">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
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
    </div>
  );
}
