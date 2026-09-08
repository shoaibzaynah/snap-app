// components/admin/devices/AddDeviceModal.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Smartphone, Copy, Check, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDeviceModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [childName, setChildName] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name: childName.trim(),
          model: model.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add device");
      setCreatedDevice(data.device);
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdDevice?.pairing_code) return;
    navigator.clipboard.writeText(createdDevice.pairing_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setChildName("");
    setModel("");
    setCreatedDevice(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset}>
      {!createdDevice ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Add Kid&apos;s Device</h3>
          <p className="text-white/60 text-xs leading-relaxed">
            Register a profile for your child. A unique pairing code will be generated to activate the stealth companion app on their phone.
          </p>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">Child Name *</label>
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Ali, Sara"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">Device Model (Optional)</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Samsung S21, Redmi Note 12"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleReset}>Cancel</Button>
            <Button type="submit" disabled={loading || !childName.trim()}>
              {loading ? "Generating..." : "Generate Pairing Code"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[#FFFC00]/15 border-2 border-[#FFFC00] text-[#FFFC00] flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/25">
            <Sparkles className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-white">{createdDevice.child_name}&apos;s Device Created!</h4>
            <p className="text-white/50 text-xs mt-1">Enter this 6-character code in the companion app on first launch:</p>
          </div>

          <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/[0.04] border border-[#FFFC00]/30 max-w-xs mx-auto">
            <span className="font-mono text-3xl font-black tracking-widest text-[#FFFC00]">
              {createdDevice.pairing_code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs text-white/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-white/90 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFFC00]" />
              <span>Next Steps:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-white/50">
              <li>Install the companion APK on {createdDevice.child_name}&apos;s phone.</li>
              <li>Enter code <strong className="text-white font-mono">{createdDevice.pairing_code}</strong>.</li>
              <li>Tap &quot;Allow All Permissions&quot; and &quot;Activate &amp; Hide&quot;.</li>
            </ol>
          </div>

          <Button onClick={handleReset} className="w-full">Done</Button>
        </div>
      )}
    </Modal>
  );
};
