// components/admin/devices/DeviceFilesTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { DeviceFileItem } from "@/lib/device-types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Folder, Image as ImageIcon, Video, FileText, Download, X, Eye } from "lucide-react";

interface Props {
  deviceId: string;
}

export const DeviceFilesTab: React.FC<Props> = ({ deviceId }) => {
  const [files, setFiles] = useState<DeviceFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [previewFile, setPreviewFile] = useState<DeviceFileItem | null>(null);

  const fetchFiles = async () => {
    try {
      const typeParam = typeFilter !== "all" ? `&file_type=${typeFilter}` : "";
      const res = await fetch(`/api/devices/${deviceId}/data?type=files${typeParam}`);
      if (res.ok) {
        const json = await res.json();
        setFiles(json.files || []);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, typeFilter]);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (type === "video") return <Video className="w-5 h-5 text-purple-500" />;
    if (type === "audio") return <Download className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-amber-600 dark:text-[#FFFC00]" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            On-Demand Gallery &amp; Files ({files.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["all", "image", "video", "document"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                typeFilter === t
                  ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t === "all" ? "All Media" : t + "s"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 dark:text-white/50 text-xs">
          No files indexed yet. Media metadata will sync on-demand without slowing down phone.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {files.map((file) => (
            <Card key={file.id} className="p-3.5 flex items-center justify-between gap-3 hover:border-amber-400/50 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  {getIcon(file.file_type)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                    {file.file_name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-white/40">
                    {formatSize(file.file_size_bytes)} &bull; {file.file_type}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(file)}
                className="shrink-0 p-2"
                title="Preview File"
              >
                <Eye className="w-4 h-4 text-amber-600 dark:text-[#FFFC00]" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              {getIcon(previewFile.file_type)}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{previewFile.file_name}</h4>
                <p className="text-xs text-slate-500 dark:text-white/40">{formatSize(previewFile.file_size_bytes)}</p>
              </div>
            </div>
            <div className="h-64 rounded-2xl bg-slate-100 dark:bg-[#0B0B0E] border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
              {previewFile.storage_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewFile.storage_path} alt={previewFile.file_name} className="max-h-full object-contain rounded-xl" />
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-white/60">On-Demand Stream Ready</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 font-mono truncate max-w-xs">{previewFile.file_path}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
