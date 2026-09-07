import React from "react";
import { Send, Sparkles, Share2, MapPin } from "lucide-react";

interface SnapBottomBarProps {
  isLocationActive?: boolean;
}

export const SnapBottomBar: React.FC<SnapBottomBarProps> = ({ isLocationActive = false }) => {
  return (
    <div className="w-full px-4 py-3 flex flex-col gap-2 z-20 select-none">

      {/* Action bar: Chat pill, Lens, Share */}
      <div className="flex items-center gap-3 w-full">
        {/* Chat / Reply Input mock */}
        <div className="flex-1 flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-white/50 text-xs font-medium cursor-pointer transition-all active:scale-[0.98]">
          <span className="truncate">Send a chat...</span>
          <Send className="w-3.5 h-3.5 text-white/60 ml-2 shrink-0" />
        </div>

        {/* Lens icon button */}
        <button
          aria-label="Snapchat Lens"
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-90 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#FFFC00] transition-all"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Share action button */}
        <button
          aria-label="Share Snap"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "SNAP APP", url: window.location.href }).catch(() => {});
            }
          }}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-90 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
