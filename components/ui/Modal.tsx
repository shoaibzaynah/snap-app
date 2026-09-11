import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop with native Snapchat-style blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-fadeIn"
      />

      {/* Sheet Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md bg-[#141418] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl p-6 pb-[max(env(safe-area-inset-bottom,0px)+16px,24px)] sm:p-7 shadow-2xl transition-transform animate-slideUp text-white",
          className
        )}
      >
        {/* Top Handle for mobile drawer feel */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
        {children}
      </div>
    </div>
  );
};
