// components/admin/devices/DeviceCameraGallery.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Eye, X, Download, Clock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";
import { formatLocalTime } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface CameraCapture {
  id: string;
  command: string;
  result_media_path: string;
  executed_at: string;
  payload?: { camera?: string };
}

interface Props {
  captures: CameraCapture[];
  onTriggerSnap: (camera: "front" | "back") => void;
  onDeleteSnap?: (commandId: string) => void;
  onBulkDeleteSnaps?: () => void;
}

export const DeviceCameraGallery: React.FC<Props> = ({ captures, onTriggerSnap, onDeleteSnap, onBulkDeleteSnaps }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowLeft" && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
      else if (e.key === "ArrowRight" && selectedIndex < captures.length - 1) setSelectedIndex(selectedIndex + 1);
      else if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, captures.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#FFFC00]" />
            Camera Snapshots ({captures.length})
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Silent front &amp; back photos captured to verify surroundings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onTriggerSnap("front")} className="py-2 px-3 rounded-xl bg-[#FFFC00] hover:bg-[#ffe500] text-black font-bold text-xs transition-all active:scale-95 shadow-lg shadow-yellow-500/20">
            Front Snap
          </button>
          <button onClick={() => onTriggerSnap("back")} className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95">
            Back Snap
          </button>
          {onBulkDeleteSnaps && captures.length > 0 && (
            <button onClick={() => { if (confirm("Delete ALL snapshots?")) onBulkDeleteSnaps(); }} className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition-all flex items-center gap-1.5 shrink-0" title="Delete All Snaps">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {captures.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center">
          <Camera className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white/80">No Camera Snapshots Yet</p>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">Click &quot;Front Snap&quot; or &quot;Back Snap&quot; to silently take a verification photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {captures.map((cap, idx) => {
            const photoUrl = getSnapImageUrl(cap.result_media_path);
            const cameraType = cap.payload?.camera === "back" ? "Back Camera" : "Front Camera";

            return (
              <div key={cap.id} onClick={() => setSelectedIndex(idx)} className="snap-dark-surface snap-photo-card group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer hover:border-[#FFFC00] transition-all" data-dark-surface="true">
                <Image src={photoUrl} alt={cameraType} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/15 shadow-md" style={{ color: '#FFFC00', backgroundColor: 'rgba(0,0,0,0.85)' }}>
                    {cameraType}
                  </span>
                </div>
                {onDeleteSnap && (
                  <button onClick={(e) => { e.stopPropagation(); if (confirm("Are you sure you want to delete this snap?")) onDeleteSnap(cap.id); }} className="absolute top-2 right-2 p-2 rounded-xl hover:!bg-rose-600 transition-all border border-white/20 shadow-lg active:scale-95 z-20" style={{ color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.85)' }} title="Delete Snap">
                    <Trash2 className="w-4 h-4" style={{ stroke: '#FFFFFF', color: '#FFFFFF' }} />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold px-2 py-1 rounded-lg border border-white/20 shadow-md" style={{ color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.85)' }}>
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ stroke: '#FFFC00', color: '#FFFC00' }} />
                    <span style={{ color: '#FFFFFF' }}>{formatLocalTime(cap.executed_at)}</span>
                  </span>
                  <div className="p-1 rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity shadow-md" style={{ color: '#FFFC00', backgroundColor: 'rgba(0,0,0,0.85)' }}>
                    <Eye className="w-3.5 h-3.5" style={{ stroke: '#FFFC00', color: '#FFFC00' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal with Next / Prev */}
      {selectedIndex !== null && captures[selectedIndex] && (
        <div onClick={() => setSelectedIndex(null)} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-2 left-2 z-20 font-mono text-xs text-white/80 bg-black/70 border border-white/20 px-2.5 py-1 rounded-xl">
              {selectedIndex + 1} / {captures.length} &bull; {captures[selectedIndex].payload?.camera === "back" ? "Back" : "Front"}
            </div>
            <button onClick={() => setSelectedIndex(null)} className="absolute top-2 right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-20">
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-full aspect-[3/4] max-h-[75vh] rounded-3xl overflow-hidden border border-white/20">
              {selectedIndex > 0 && (
                <button
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center active:scale-90 shadow-xl transition-all"
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {selectedIndex < captures.length - 1 && (
                <button
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center active:scale-90 shadow-xl transition-all"
                  title="Next (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              <Image src={getSnapImageUrl(captures[selectedIndex].result_media_path)} alt="Enlarged snapshot" fill className="object-contain" />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 w-full max-w-md">
              <button
                onClick={() => selectedIndex > 0 && setSelectedIndex(selectedIndex - 1)}
                disabled={selectedIndex === 0}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  selectedIndex > 0 ? "bg-white/10 hover:bg-white/20 text-white border-white/20 active:scale-95" : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-40"
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <a
                href={getSnapImageUrl(captures[selectedIndex].result_media_path)} download={`kid-snapshot-${captures[selectedIndex].id}.jpg`} target="_blank" rel="noopener noreferrer"
                onClick={() => toast.success("Downloading full resolution snapshot...")}
                className="py-2 px-4 rounded-xl bg-[#FFFC00] text-black font-bold text-xs shadow-xl flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => selectedIndex < captures.length - 1 && setSelectedIndex(selectedIndex + 1)}
                disabled={selectedIndex === captures.length - 1}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                  selectedIndex < captures.length - 1 ? "bg-white/10 hover:bg-white/20 text-white border-white/20 active:scale-95" : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed opacity-40"
                }`}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
