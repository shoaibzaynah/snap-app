import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface SnapStateViewProps {
  type: "loading" | "expired" | "not_found" | "inactive" | "error";
  message?: string;
  onRetry?: () => void;
}

export const SnapStateView: React.FC<SnapStateViewProps> = ({ type, message, onRetry }) => {
  if (type === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full p-2 bg-[#FFFC00] shadow-[0_0_25px_rgba(255,252,0,0.5)] animate-bounce flex items-center justify-center">
          <Image
            src="/LOGO.svg"
            alt="Loading Snap"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-sm font-semibold text-white/70 tracking-wide animate-pulse">
          Opening Snap...
        </p>
      </div>
    );
  }

  const configs = {
    expired: {
      icon: <Clock className="w-8 h-8 text-zinc-400" />,
      title: "Snap Expired",
      desc: "This snap has expired and is no longer available to view.",
    },
    not_found: {
      icon: <AlertTriangle className="w-8 h-8 text-[#FFFC00]" />,
      title: "Snap Not Found",
      desc: "This link is invalid or may have been deleted by the creator.",
    },
    inactive: {
      icon: <Clock className="w-8 h-8 text-amber-400" />,
      title: "Snap Inactive",
      desc: "This link is currently paused by the creator.",
    },
    error: {
      icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
      title: "Unable to Load Snap",
      desc: message || "A network or server error occurred while retrieving this snap.",
    },
  };

  const config = configs[type] || configs.error;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-4">
        {config.icon}
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{config.title}</h2>
      <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-6">
        {config.desc}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="md">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
};
