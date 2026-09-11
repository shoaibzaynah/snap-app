// components/admin/devices/DeviceFetchButton.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceFetchButtonProps {
  onFetch: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export const DeviceFetchButton: React.FC<DeviceFetchButtonProps> = ({
  onFetch,
  loading = false,
  label = "Fetch",
  className = "",
  showIcon = true,
}) => {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cooldown > 0 || loading) return;
    setCooldown(5); // 5-second anti-spam cooldown per Rule 12 Section 6
    onFetch();
  };

  const isDisabled = cooldown > 0 || loading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={cooldown > 0 ? `Please wait ${cooldown}s before fetching again` : "Fetch latest updates"}
      className={cn(
        "flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all select-none",
        isDisabled
          ? "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
          : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10 active:scale-95 shadow-sm",
        className
      )}
    >
      {showIcon && (
        <RefreshCw
          className={cn(
            "w-3 h-3 text-[#FFFC00] shrink-0",
            (loading || cooldown > 0) && "animate-spin"
          )}
        />
      )}
      <span>{cooldown > 0 ? `${label} (${cooldown}s)` : label}</span>
    </button>
  );
};
