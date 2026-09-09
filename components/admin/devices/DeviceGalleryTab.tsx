// components/admin/devices/DeviceGalleryTab.tsx
"use client";

import React, { useState, useMemo } from "react";
import { DeviceFileItem } from "@/lib/device-types";
import { Input } from "@/components/ui/Input";
import { Image as ImageIcon, Video, Music, FileText, Search, RefreshCw, Folder, Trash2 } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";
import { DeviceFilePreviewModal } from "./DeviceFilePreviewModal";

interface Props {
  files: DeviceFileItem[];
  loading?: boolean;
  onSyncGallery: () => void;
  onSendCommand?: (cmd: string, payload?: any, label?: string) => void;
  onDeleteFile?: (id: string) => void;
  onBulkDeleteFiles?: () => void;
}

type SubTab = "all" | "image" | "video" | "audio" | "document";

export const DeviceGalleryTab: React.FC<Props> = ({
  files,
  loading,
  onSyncGallery,
  onSendCommand,
  onDeleteFile,
  onBulkDeleteFiles,
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>("all");
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<DeviceFileItem | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: files.length,
    image: files.filter((f) => f.file_type === "image").length,
    video: files.filter((f) => f.file_type === "video").length,
    audio: files.filter((f) => f.file_type === "audio").length,
    document: files.filter((f) => f.file_type === "document").length,
  }), [files]);

  const filtered = useMemo(() => files.filter((f) =>
    (activeTab === "all" || f.file_type === activeTab) && (!search || f.file_name.toLowerCase().includes(search.toLowerCase()))
  ), [files, activeTab, search]);

  const formatSize = (b: number) => !b ? "0 KB" : b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB";

  const getIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="w-5 h-5 text-[#FFFC00]" />;
    if (type === "video") return <Video className="w-5 h-5 text-purple-400" />;
    if (type === "audio") return <Music className="w-5 h-5 text-emerald-400" />;
    if (type === "document") return <FileText className="w-5 h-5 text-blue-400" />;
    return <Folder className="w-5 h-5 text-white/50" />;
  };

  const requestFile = (f: DeviceFileItem) => {
    onSendCommand?.("upload_file", { file_path: f.file_path, file_id: f.id, file_name: f.file_name }, `Fetch ${f.file_name}`);
    setRequestStatus(`⚡ Upload command sent to phone for "${f.file_name}".`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#FFFC00]" /> Gallery &amp; Files Explorer ({files.length})
          </h3>
          <p className="text-xs text-white/50 mt-0.5">Browse images, camera videos, voice notes, and documents stored on child phone.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-xs bg-white/5" />
          </div>
          <button onClick={onSyncGallery} className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FFFC00]/15 hover:bg-[#FFFC00]/25 text-[#FFFC00] font-bold text-xs border border-[#FFFC00]/30 transition-all active:scale-95 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Gallery
          </button>
          {onBulkDeleteFiles && files.length > 0 && (
            <button onClick={() => { if (confirm("Delete ALL files from cloud index?")) onBulkDeleteFiles(); }} className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-bold text-xs border border-rose-600/30 transition-all shrink-0">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 overflow-x-auto select-none">
        {SUB_TABS.map(({ id, label, count }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === id ? "bg-[#FFFC00] text-black shadow-md" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <span>{label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === id ? "bg-black/20 text-black" : "bg-white/10 text-white/60"}`}>{count}</span>
          </button>
        ))}
      </div>

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
            <div key={file.id} className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-start gap-3 group relative">
              <div onClick={() => setPreviewFile(file)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer">
                {file.thumbnail_path ? (
                  <img src={file.thumbnail_path} alt={file.file_name} className="w-full h-full object-cover" />
                ) : file.storage_path && file.file_type === "image" ? (
                  <img src={getSnapImageUrl(file.storage_path)} alt={file.file_name} className="w-full h-full object-cover" />
                ) : (
                  getIcon(file.file_type)
                )}
              </div>
              <div onClick={() => setPreviewFile(file)} className="min-w-0 flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FFFC00] transition-colors" title={file.file_name}>{file.file_name}</h4>
                  {file.storage_path && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">READY</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40 font-mono">
                  <span>{formatSize(file.file_size_bytes)}</span>
                  <span>&bull;</span>
                  <span className="capitalize">{file.file_type}</span>
                </div>
                <p className="text-[10px] text-white/30 truncate mt-0.5 font-mono" title={file.file_path}>{file.file_path}</p>
              </div>
              {onDeleteFile && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${file.file_name}" from list?`)) onDeleteFile(file.id); }}
                  className="p-1 rounded-lg hover:bg-rose-500/20 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete file record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <DeviceFilePreviewModal
        file={previewFile}
        onClose={() => { setPreviewFile(null); setRequestStatus(null); }}
        onRequestFile={requestFile}
        requestStatus={requestStatus}
        formatSize={formatSize}
        getIcon={getIcon}
      />
    </div>
  );
};