// components/admin/devices/DeviceCameraGallery.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Camera, Eye, X, Download, Clock } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";

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
}

export const DeviceCameraGallery: React.FC<Props> = ({ captures, onTriggerSnap }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#FFFC00]" />
            Camera Snapshots
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Silent front &amp; back photos captured to verify surroundings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTriggerSnap("front")}
            className="py-2 px-3 rounded-xl bg-[#FFFC00] hover:bg-[#ffe500] text-black font-bold text-xs transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
          >
            📸 Front Snap
          </button>
          <button
            onClick={() => onTriggerSnap("back")}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
          >
            📸 Back Snap
          </button>
        </div>
      </div>

      {captures.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center">
          <Camera className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white/80">No Camera Snapshots Yet</p>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
            Click &quot;📸 Front Snap&quot; or &quot;📸 Back Snap&quot; to silently take a verification photo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {captures.map((cap) => {
            const photoUrl = getSnapImageUrl(cap.result_media_path);
            const cameraType = cap.payload?.camera === "back" ? "Back Camera" : "Front Camera";

            return (
              <div
                key={cap.id}
                onClick={() => setSelectedImage(photoUrl)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer hover:border-[#FFFC00] transition-all"
              >
                <Image
                  src={photoUrl}
                  alt={cameraType}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#FFFC00] border border-white/10">
                    {cameraType}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/70">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(cap.executed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#FFFC00]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full aspect-[3/4] max-h-[80vh] rounded-3xl overflow-hidden border border-white/20">
              <Image src={selectedImage} alt="Enlarged snapshot" fill className="object-contain" />
            </div>
            <a
              href={selectedImage}
              download="kid-snapshot.jpg"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-3 flex items-center gap-2 py-2 px-4 rounded-xl bg-[#FFFC00] text-black font-bold text-xs shadow-xl"
            >
              <Download className="w-4 h-4" /> Download Full Resolution
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
