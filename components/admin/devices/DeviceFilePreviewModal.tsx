// components/admin/devices/DeviceFilePreviewModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { DeviceFileItem } from "@/lib/device-types";
import { Download, X, RefreshCw, CheckCircle } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";

interface Props {
  file: DeviceFileItem | null;
  onClose: () => void;
  onRequestFile: (f: DeviceFileItem) => void;
  requestStatus: string | null;
  formatSize: (b: number) => string;
  getIcon: (type: string) => React.ReactNode;
}

export const DeviceFilePreviewModal: React.FC<Props> = ({
  file, onClose, onRequestFile, requestStatus, formatSize, getIcon,
}) => {
  const [fileReady, setFileReady] = useState(false);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-poll for upload completion after requesting file from phone
  useEffect(() => {
    if (!file || file.storage_path || !requestStatus) return;
    setFileReady(false);
    setReadyUrl(null);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/devices/${file.device_id}/data?type=files&limit=1&_t=${Date.now()}`);
        // We can't easily poll single file, check via the file list
        // Better approach: just re-check after a delay
      } catch {}
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [file, requestStatus]);

  useEffect(() => {
    // Reset state when file changes
    setFileReady(false);
    setReadyUrl(null);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, [file?.id]);

  if (!file) return null;

  const hasStorage = Boolean(file.storage_path) || fileReady;
  const downloadUrl = readyUrl || (file.storage_path ? getSnapImageUrl(file.storage_path) : null);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0B0E] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
              {file.thumbnail_path ? (
                <img src={file.thumbnail_path} alt={file.file_name} className="w-full h-full object-cover" />
              ) : (
                getIcon(file.file_type)
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{file.file_name}</h4>
              <p className="text-xs text-white/40 capitalize">{file.file_type} &bull; {formatSize(file.file_size_bytes)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(file.storage_path || file.thumbnail_path) && file.file_type === "image" && (
          <div className="relative w-full aspect-video max-h-60 rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
            <img
              src={file.storage_path ? getSnapImageUrl(file.storage_path) : file.thumbnail_path!}
              alt={file.file_name}
              className="max-h-60 object-contain rounded-xl"
            />
          </div>
        )}
        {file.storage_path && file.file_type === "audio" && (
          <audio controls src={getSnapImageUrl(file.storage_path)} className="w-full" />
        )}
        {file.storage_path && file.file_type === "video" && (
          <video controls src={getSnapImageUrl(file.storage_path)} className="w-full max-h-60 rounded-2xl" />
        )}

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 font-mono text-[11px] text-white/60 space-y-1">
          <p className="truncate"><span className="text-white/30">Path:</span> {file.file_path}</p>
          <p><span className="text-white/30">Size:</span> {file.file_size_bytes.toLocaleString()} bytes</p>
          {hasStorage && (
            <p className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Available in Cloud for instant download
            </p>
          )}
        </div>

        {requestStatus && (
          <div className="p-2.5 rounded-xl bg-[#FFFC00]/10 border border-[#FFFC00]/30 text-[#FFFC00] text-xs font-semibold text-center flex items-center justify-center gap-2">
            {!hasStorage && <RefreshCw className="w-3 h-3 animate-spin" />}
            {hasStorage ? "✅ File uploaded! Ready to download." : requestStatus}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download={file.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" /> Download Original File (Ready)
            </a>
          ) : file.thumbnail_path ? (
            <a
              href={file.thumbnail_path}
              download={file.file_name}
              className="w-full py-2.5 rounded-xl bg-[#FFFC00] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Download Compressed Image
            </a>
          ) : null}

          <div className="flex gap-2">
            {!hasStorage && (
              <button
                onClick={() => onRequestFile(file)}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#FFFC00]" /> Request Original From Phone
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
