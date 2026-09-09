// components/admin/devices/DeviceGalleryTab.tsx
"use client";

import React, { useState, useMemo } from "react";
import { DeviceFileItem } from "@/lib/device-types";
import { Input } from "@/components/ui/Input";
import { Image as ImageIcon, Video, Music, FileText, Search, RefreshCw, Folder } from "lucide-react";

interface Props {
  files: DeviceFileItem[];
  loading?: boolean;
  onSyncGallery: () => void;
}

type SubTab = "all" | "image" | "video" | "audio" | "document";

export const DeviceGalleryTab: React.FC<Props> = ({ files, loading, onSyncGallery }) => {
  const [activeTab, setActiveTab] = useState<SubTab>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      all: files.length,
      image: files.filter((f) => f.file_type === "image").length,
      video: files.filter((f) => f.file_type === "video").length,
      audio: files.filter((f) => f.file_type === "audio").length,
      document: files.filter((f) => f.file_type === "document").length,
    };
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesTab = activeTab === "all" || f.file_type === activeTab;
      const matchesSearch = !search || f.file_name.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [files, activeTab, search]);

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + " MB";
    return Math.round(bytes / 1024) + " KB";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="w-5 h-5 text-[#FFFC00]" />;
      case "video": return <Video className="w-5 h-5 text-purple-400" />;
      case "audio": return <Music className="w-5 h-5 text-emerald-400" />;
      case "document": return <FileText className="w-5 h-5 text-blue-400" />;
      default: return <Folder className="w-5 h-5 text-white/50" />;
    }
  };

  const SUB_TABS: { id: SubTab; label: string; count: number }[] = [
    { id: "all", label: "All Files", count: counts.all },
    { id: "image", label: "Images", count: counts.image },
    { id: "video", label: "Videos", count: counts.video },
    { id: "audio", label: "Audio", count: counts.audio },
    { id: "document", label: "Docs", count: counts.document },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#FFFC00]" />
            Gallery & Files Explorer ({files.length})
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Browse images, camera videos, voice notes, and documents stored on the child&apos;s phone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-8 h-8 text-xs bg-white/5"
            />
          </div>
          <button
            onClick={onSyncGallery}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FFFC00]/15 hover:bg-[#FFFC00]/25 text-[#FFFC00] font-bold text-xs border border-[#FFFC00]/30 transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Gallery
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 overflow-x-auto select-none">
        {SUB_TABS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === id
                ? "bg-[#FFFC00] text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === id ? "bg-black/20 text-black" : "bg-white/10 text-white/60"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* File Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-white/40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#FFFC00]" /> Loading gallery...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/50 text-xs">
          {files.length === 0 ? "No media files synced yet. Click 'Sync Gallery' to fetch files from device." : "No files match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                {getIcon(file.file_type)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FFFC00] transition-colors" title={file.file_name}>
                  {file.file_name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40 font-mono">
                  <span>{formatSize(file.file_size_bytes)}</span>
                  <span>&bull;</span>
                  <span className="capitalize">{file.file_type}</span>
                </div>
                <p className="text-[10px] text-white/30 truncate mt-0.5 font-mono" title={file.file_path}>
                  {file.file_path}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
