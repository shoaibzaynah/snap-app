// components/ui/Tooltip.tsx
"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export type TooltipPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "bottom-right"
  | "bottom-left";

export interface TooltipProps {
  content: ReactNode;
  title?: string;
  children?: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
  widthClass?: string;
  interactive?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  children,
  placement = "bottom-right",
  className = "",
  widthClass = "w-72 sm:w-88",
  interactive = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mobileStyle, setMobileStyle] = useState<React.CSSProperties | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (interactive) {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
    } else {
      setIsOpen(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const isMobile = window.innerWidth < 640;
        if (isMobile) {
          const rect = containerRef.current.getBoundingClientRect();
          const top = Math.min(Math.max(rect.bottom + 6, 8), window.innerHeight - 180);
          setMobileStyle({
            position: "fixed",
            top: `${top}px`,
            left: "12px",
            right: "12px",
            width: "auto",
            maxWidth: "calc(100vw - 24px)",
            maxHeight: `calc(100vh - ${top + 20}px)`,
            overflowY: "auto",
            zIndex: 9999,
          });
        } else {
          setMobileStyle(null);
        }
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    } else {
      setMobileStyle(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Position alignment styling
  const getPlacementClasses = () => {
    switch (placement) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "bottom-left":
        return "top-full left-0 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "bottom-right":
      default:
        return "top-full right-0 mt-2";
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      {children ? (
        <div onClick={handleClick} className="inline-flex items-center cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 dark:text-white/40 dark:hover:text-[#FFFC00] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

      {/* Popover Bubble */}
      {isOpen && (
        <div
          role="tooltip"
          style={mobileStyle || undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`${
            mobileStyle
              ? ""
              : `absolute ${getPlacementClasses()} ${widthClass} max-w-[calc(100vw-2rem)]`
          } p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0B0B0E]/95 backdrop-blur-xl border border-amber-400/40 dark:border-[#FFFC00]/30 text-slate-900 dark:text-white shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150 text-left ${className}`}
        >
          {title && (
            <div className="text-xs font-bold text-amber-700 dark:text-[#FFFC00] pb-2 mb-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="truncate pr-2">{title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold shrink-0"
                title="Close"
              >
                ✕
              </button>
            </div>
          )}
          <div className="text-xs text-slate-700 dark:text-white/80 leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
