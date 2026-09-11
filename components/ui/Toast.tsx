// components/ui/Toast.tsx
"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Info } from "lucide-react";

export type ToastType = "request" | "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show: (message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    listeners.forEach((fn) => fn({ id, message, type, duration }));
  },
  request: (message: string, duration = 3500) => {
    toast.show(message, "request", duration);
  },
  success: (message: string, duration = 2800) => {
    toast.show(message, "success", duration);
  },
  error: (message: string, duration = 4000) => {
    toast.show(message, "error", duration);
  },
  info: (message: string, duration = 3000) => {
    toast.show(message, "info", duration);
  },
};

export const ToastContainer: React.FC = () => {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const handler: ToastListener = (t) => {
      if (timer) clearTimeout(timer);
      setActiveToast(t);
      timer = setTimeout(() => {
        setActiveToast(null);
      }, t.duration || 3000);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!activeToast) return null;

  return (
    <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none px-3 w-full max-w-sm flex justify-center animate-fadeIn">
      <div
        className={`pointer-events-auto max-w-full py-1.5 px-3.5 sm:py-2 sm:px-4 rounded-full backdrop-blur-xl border shadow-2xl flex items-center gap-2 select-none transition-all duration-300 ${
          activeToast.type === "request"
            ? "bg-[#0B0B0E]/95 border-[#FFFC00]/40 shadow-[#FFFC00]/10 text-[#FFFC00]"
            : activeToast.type === "success"
            ? "bg-[#0B0B0E]/95 border-emerald-500/40 shadow-emerald-500/10 text-emerald-300"
            : activeToast.type === "error"
            ? "bg-[#0B0B0E]/95 border-rose-500/40 shadow-rose-500/10 text-rose-300"
            : "bg-[#0B0B0E]/95 border-cyan-500/40 shadow-cyan-500/10 text-cyan-300"
        }`}
      >
        {activeToast.type === "request" && (
          <RefreshCw className="w-3 h-3 text-[#FFFC00] animate-spin shrink-0" />
        )}
        {activeToast.type === "success" && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        {activeToast.type === "error" && (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}
        {activeToast.type === "info" && (
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        )}
        <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-white truncate">
          {activeToast.message}
        </span>
      </div>
    </div>
  );
};
