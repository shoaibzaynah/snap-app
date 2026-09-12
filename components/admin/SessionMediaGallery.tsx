// components/admin/SessionMediaGallery.tsx
"use client";

import React from "react";
import { getSnapImageUrl } from "@/lib/storage";
import { SessionPhotoCard } from "./SessionPhotoCard";
import { Mic, Video, Download } from "lucide-react";
import { toast } from "@/components/ui/Toast";

interface Props {
  photoPath?: string | null;
  audioPath?: string | null;
  videoPath?: string | null;
  visitorIp?: string | null;
}

export const SessionMediaGallery: React.FC<Props> = ({
  photoPath, audioPath, videoPath, visitorIp,
}) => {
  const photoUrl = photoPath ? getSnapImageUrl(photoPath) : null;
  const audioUrl = audioPath ? getSnapImageUrl(audioPath) : null;
  const videoUrl = videoPath ? getSnapImageUrl(videoPath) : null;

  if (!photoUrl && !audioUrl && !videoUrl) return null;

  return (
    <div className="space-y-3 pt-1 border-t border-white/5">
      <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">
        Captured Session Media
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {photoUrl && (
          <SessionPhotoCard photoUrl={photoUrl} visitorIp={visitorIp || undefined} />
        )}

        {videoUrl && (
          <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
              <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> 3s Video Burst</span>
              <a
                href={videoUrl}
                download={`stealth_clip.${videoPath?.split(".").pop() || "mp4"}`}
                onClick={() => toast.success("Downloading video burst...")}
                className="text-white/60 hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
            <video src={videoUrl} controls playsInline className="w-full h-36 rounded-xl object-contain bg-black" />
          </div>
        )}

        {audioUrl && (
          <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> 5s Ambient Audio Memo</span>
              <a
                href={audioUrl}
                download={`ambient_memo.${audioPath?.split(".").pop() || "m4a"}`}
                onClick={() => toast.success("Downloading audio memo...")}
                className="text-white/60 hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
            <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
};
