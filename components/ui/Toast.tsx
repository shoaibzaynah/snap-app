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
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+62px)] sm:top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none px-3 w-full max-w-sm flex justify-center animate-fadeIn">
      <div
        className={`pointer-events-auto max-w-full py-2 px-4 rounded-full backdrop-blur-xl border shadow-xl flex items-center gap-2 select-none transition-all duration-300 ${
          activeToast.type === "request"
            ? "bg-white/95 dark:bg-[#121216]/95 border-amber-400/60 dark:border-[#FFFC00]/40 shadow-amber-500/10 text-amber-600 dark:text-[#FFFC00]"
            : activeToast.type === "success"
            ? "bg-white/95 dark:bg-[#121216]/95 border-emerald-400/60 dark:border-emerald-500/40 shadow-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : activeToast.type === "error"
            ? "bg-white/95 dark:bg-[#121216]/95 border-rose-400/60 dark:border-rose-500/40 shadow-rose-500/10 text-rose-600 dark:text-rose-400"
            : "bg-white/95 dark:bg-[#121216]/95 border-sky-400/60 dark:border-cyan-500/40 shadow-sky-500/10 text-sky-600 dark:text-cyan-400"
        }`}
      >
        {activeToast.type === "request" && (
          <RefreshCw className="w-3.5 h-3.5 text-amber-500 dark:text-[#FFFC00] animate-spin shrink-0" />
        )}
        {activeToast.type === "success" && (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
        {activeToast.type === "error" && (
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        )}
        {activeToast.type === "info" && (
          <Info className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0" />
        )}
        <span className="text-[12px] sm:text-xs font-semibold tracking-wide text-slate-900 dark:text-white truncate">
          {activeToast.message}
        </span>
      </div>
    </div>
  );
};
