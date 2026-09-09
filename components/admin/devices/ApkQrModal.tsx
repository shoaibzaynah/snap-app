// components/admin/devices/ApkQrModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { QrCode, Download, Copy, Check, Eye, EyeOff, Globe, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkQrModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [liveDomain, setLiveDomain] = useState<string>("");
  const [showQr, setShowQr] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const host = window.location.host;
      const targetUrl = `${origin}/api/downloads/companion`;
      setLiveDomain(host);
      setDownloadUrl(targetUrl);

      // Generate High-DPI QR Code
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code generation failed", err));
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (!downloadUrl) return;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `snap-app-companion-qr-${liveDomain.replace(/[:.]/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 text-center sm:text-left max-h-[85vh] overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-[#FFFC00] shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Scan &amp; Download APK
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                Instant pairing &amp; setup on child&apos;s phone
              </p>
            </div>
          </div>

          <Button
            variant="glass"
            size="sm"
            onClick={() => setShowQr(!showQr)}
            className="text-[11px] h-8 px-2.5 rounded-full border-slate-200 dark:border-white/10 shrink-0"
            title={showQr ? "Hide QR Code" : "Show QR Code"}
          >
            {showQr ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
            <span>{showQr ? "Hide" : "Show"}</span>
          </Button>
        </div>

        {/* Live Detected Domain Badge */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/70 truncate">
            <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-[11px]">Live Domain:</span>
            <span className="font-mono text-slate-900 dark:text-white text-[11px] truncate">
              {liveDomain || "Detecting..."}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto-Detected
          </span>
        </div>

        {/* QR Code Container with Show / Hide state */}
        {showQr ? (
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#070709] border-2 border-dashed border-amber-500/40 dark:border-[#FFFC00]/40 shadow-inner">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Companion APK Download QR Code"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                Generating QR Code...
              </div>
            )}
            <p className="mt-3 text-xs font-semibold text-slate-800 dark:text-white text-center">
              Child ke phone camera se scan karein — instant APK download hogi!
            </p>
          </div>
        ) : (
          <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2">
            <EyeOff className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-white/50">QR code is hidden for privacy.</p>
            <Button size="sm" variant="secondary" onClick={() => setShowQr(true)} className="text-xs">
              Show QR Code
            </Button>
          </div>
        )}

        {/* Action Buttons: Download QR Image, Copy Link, Direct APK */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadQr}
            disabled={!qrDataUrl}
            className="text-xs h-9 rounded-full border-slate-200 dark:border-white/10 font-bold"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-[#FFFC00]" />
            Save QR Image
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="text-xs h-9 rounded-full border-slate-200 dark:border-white/10 font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        {/* Direct APK Link */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={downloadUrl || "/downloads/snap-safety-companion.apk"}
            download="snap-safety-companion.apk"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#FFFC00] text-black font-bold text-xs shadow-lg shadow-yellow-500/25 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Download APK File
          </a>
          <Button variant="ghost" onClick={onClose} size="sm" className="rounded-full text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
