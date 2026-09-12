// components/admin/devices/DeviceFilePreviewModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { DeviceFileItem } from "@/lib/device-types";
import { Download, X, RefreshCw, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";
import { toast } from "@/components/ui/Toast";

interface Props {
  file: DeviceFileItem | null;
  onClose: () => void;
  onRequestFile: (f: DeviceFileItem) => void;
  requestStatus: string | null;
  formatSize: (b: number) => string;
  getIcon: (type: string) => React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalFiles?: number;
}

export const DeviceFilePreviewModal: React.FC<Props> = ({
  file, onClose, onRequestFile, requestStatus, formatSize, getIcon,
  onNext, onPrev, currentIndex, totalFiles,
}) => {
  const [currentStoragePath, setCurrentStoragePath] = useState<string | null>(file?.storage_path || null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentStoragePath(file?.storage_path || null);
    if (!file || file.storage_path) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/devices/${file.device_id}/data/files?${file.id ? `file_id=${file.id}` : "limit=50"}&_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const m = (data?.files || []).find((f: any) => f.id === file.id || f.file_path === file.file_path);
        if (m?.storage_path) { setCurrentStoragePath(m.storage_path); if (pollRef.current) clearInterval(pollRef.current); }
      } catch {}
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [file?.id, file?.storage_path, requestStatus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev, onClose]);

  if (!file) return null;

  const hasStorage = Boolean(currentStoragePath);
  const previewImgUrl = currentStoragePath ? getSnapImageUrl(currentStoragePath) : null;
  const downloadUrl = currentStoragePath
    ? `/api/devices/${file.device_id}/data/download?path=${encodeURIComponent(currentStoragePath)}&name=${encodeURIComponent(file.file_name)}`
    : null;

  const downloadDataUri = (dataUri: string, name: string) => {
    try {
      const a = document.createElement("a"); a.href = dataUri; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0B0E] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
              {file.thumbnail_path ? (
                <img src={file.thumbnail_path} alt={file.file_name} className="w-full h-full object-cover" />
              ) : getIcon(file.file_type)}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{file.file_name}</h4>
              <p className="text-xs text-white/40 capitalize">{file.file_type} &bull; {formatSize(file.file_size_bytes)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {totalFiles && totalFiles > 1 && currentIndex !== undefined && (
              <span className="text-[11px] font-mono font-bold text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                {currentIndex + 1}/{totalFiles}
              </span>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white p-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Preview Area with Floating Next / Prev Arrows */}
        {(hasStorage || file.thumbnail_path) && (
          <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center min-h-[140px] max-h-80 group">
            {onPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center active:scale-90 shadow-xl transition-all"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNext && (
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center active:scale-90 shadow-xl transition-all"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {file.file_type === "video" && previewImgUrl ? (
              <video src={previewImgUrl} controls playsInline autoPlay className="w-full max-h-80 rounded-xl bg-black" />
            ) : file.file_type === "audio" && previewImgUrl ? (
              <div className="p-4 w-full flex flex-col items-center gap-2">
                <audio src={previewImgUrl} controls autoPlay className="w-full" />
              </div>
            ) : (previewImgUrl || file.thumbnail_path) ? (
              <img src={previewImgUrl || file.thumbnail_path!} alt={file.file_name} className="max-h-80 object-contain rounded-xl" />
            ) : null}
          </div>
        )}

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 font-mono text-[11px] text-white/60 space-y-1">
          <p className="truncate"><span className="text-white/30">Path:</span> {file.file_path}</p>
          <p><span className="text-white/30">Size:</span> {file.file_size_bytes.toLocaleString()} bytes</p>
          {(file.updated_at || file.created_at) && (
            <p><span className="text-white/30">Date:</span> {new Date(file.updated_at || file.created_at!).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
          )}
          {hasStorage && (
            <p className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Ready in Cloud (Open / Play / Download)
            </p>
          )}
        </div>

        {requestStatus && !hasStorage && (
          <div className="p-2.5 rounded-xl bg-[#FFFC00]/10 border border-[#FFFC00]/30 text-[#FFFC00] text-xs font-semibold text-center flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" /> Uploading from phone...
          </div>
        )}

        <div className="flex flex-col gap-2">
          {downloadUrl ? (
            <a href={downloadUrl} download={file.file_name} onClick={() => toast.success(`Downloading ${file.file_name}...`)} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-lg">
              <Download className="w-4 h-4" /> Download Original File (Ready)
            </a>
          ) : file.thumbnail_path ? (
            <button onClick={() => { toast.success(`Downloading ${file.file_name}...`); downloadDataUri(file.thumbnail_path!, file.file_name); }} className="w-full py-2.5 rounded-xl bg-[#FFFC00] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer">
              <Download className="w-4 h-4" /> Download Compressed Image
            </button>
          ) : null}

          <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={!onPrev} className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${onPrev ? "bg-white/10 hover:bg-white/15 text-white border-white/10 active:scale-95" : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-40"}`} title="Previous (Left Arrow)">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button onClick={onNext} disabled={!onNext} className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${onNext ? "bg-white/10 hover:bg-white/15 text-white border-white/10 active:scale-95" : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-40"}`} title="Next (Right Arrow)">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {!hasStorage && (
              <button onClick={() => { toast.request(`Requesting ${file.file_name} from phone...`); onRequestFile(file); }} className="flex-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all truncate">
                <Download className="w-3.5 h-3.5 text-[#FFFC00] shrink-0" /><span className="truncate">Request Original</span>
              </button>
            )}
            <button onClick={onClose} className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
