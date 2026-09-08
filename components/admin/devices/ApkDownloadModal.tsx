// components/admin/devices/ApkDownloadModal.tsx
"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Smartphone, EyeOff, ShieldCheck } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFC00]/15 border border-[#FFFC00]/40 flex items-center justify-center text-[#FFFC00]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Companion App (Stealth APK)
            </h3>
            <p className="text-xs text-white/50">
              Install once &bull; Auto-hides from launcher &bull; 24/7 background service
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#FFFC00] text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </div>
            <p className="text-white/80 leading-relaxed">
              <strong>Download &amp; Transfer:</strong> Download the APK file and send it to your child&apos;s phone (via WhatsApp, cable, or direct download).
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#FFFC00] text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </div>
            <p className="text-white/80 leading-relaxed">
              <strong>Enter Pairing Code:</strong> Open the app, enter the 6-character code from this dashboard, and allow all requested permissions.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#FFFC00] text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              3
            </div>
            <p className="text-white/80 leading-relaxed">
              <strong>Activate &amp; Hide:</strong> Tap the yellow &quot;Activate &amp; Hide&quot; button. The app icon will permanently disappear from the phone!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <a
            href="/downloads/snap-safety-companion.apk"
            download="snap-safety-companion.apk"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#FFFC00] text-black font-bold text-xs shadow-lg shadow-yellow-500/25 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Download APK File
          </a>
          <Button variant="ghost" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
