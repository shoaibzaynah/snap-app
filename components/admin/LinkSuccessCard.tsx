// components/admin/LinkSuccessCard.tsx
import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";

interface LinkSuccessCardProps {
  createdLink: string;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
  targetUrl?: string | null;
}

export const LinkSuccessCard: React.FC<LinkSuccessCardProps> = ({
  createdLink,
  copied,
  onCopy,
  onReset,
  targetUrl,
}) => {
  return (
    <Card variant="glow" className="p-8 text-center space-y-5 animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-[#FFFC00] mx-auto flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/20">
        👻
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Tracking Link Ready!</h2>
        <p className="text-xs text-white/60 mt-1">
          {targetUrl
            ? "When opened, location is captured and visitor redirects to destination"
            : "Share this native Snapchat-style protected link with your recipient"}
        </p>
      </div>

      <div className="flex items-center gap-2 p-2 bg-[#1C1C22] rounded-2xl border border-white/10">
        <input
          readOnly
          value={createdLink}
          className="flex-1 bg-transparent px-3 text-xs text-[#FFFC00] font-mono outline-none"
        />
        <Button onClick={onCopy} size="sm" className="gap-1.5 shrink-0">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <a href={createdLink} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Open Link
          </Button>
        </a>
        <Button onClick={onReset} size="sm" className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Create Another
        </Button>
      </div>
    </Card>
  );
};
