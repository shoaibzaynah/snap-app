import React from "react";
import { Send, Sparkles, Share2, Heart } from "lucide-react";
import { getPlatformBranding } from "@/lib/branding";

interface SnapBottomBarProps {
  isLocationActive?: boolean;
  platform?: string | null;
  targetUrl?: string | null;
}

export const SnapBottomBar: React.FC<SnapBottomBarProps> = ({
  platform,
  targetUrl,
}) => {
  const branding = getPlatformBranding(targetUrl, platform);
  const [liked, setLiked] = React.useState(false);

  const replyPlaceholder = branding.isSnap
    ? "Send a chat..."
    : platform === "instagram"
    ? "Send message..."
    : platform === "tiktok"
    ? "Add comment..."
    : "Reply to post...";

  return (
    <div className="w-full px-4 py-3 flex flex-col gap-2 z-20 select-none">
      <div className="flex items-center gap-3 w-full">
        {/* Chat / Reply Input mock */}
        <div className="flex-1 flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full border border-white/10 text-white/50 text-xs font-medium cursor-pointer transition-all active:scale-[0.98]">
          <span className="truncate">{replyPlaceholder}</span>
          <Send className="w-3.5 h-3.5 text-white/60 ml-2 shrink-0" />
        </div>

        {/* Action button (Lens for Snapchat, Heart for social platforms) */}
        {branding.isSnap ? (
          <button
            aria-label="Snapchat Lens"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-90 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#FFFC00] transition-all"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        ) : (
          <button
            aria-label="Like"
            onClick={() => setLiked(!liked)}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-90 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all"
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
          </button>
        )}

        {/* Share action button */}
        <button
          aria-label="Share Content"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: branding.name, url: window.location.href }).catch(() => {});
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
