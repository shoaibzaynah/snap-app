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
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute ${getPlacementClasses()} ${widthClass} max-w-[calc(100vw-2rem)] p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0B0B0E]/95 backdrop-blur-xl border border-amber-400/40 dark:border-[#FFFC00]/30 text-slate-900 dark:text-white shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150 text-left ${className}`}
        >
          {title && (
            <div className="text-xs font-bold text-amber-700 dark:text-[#FFFC00] pb-2 mb-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span>{title}</span>
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
