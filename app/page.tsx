import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, MapPin, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-black flex flex-col items-center justify-between p-6 sm:p-12 text-center select-none">
      {/* Top Brand Pill */}
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
        <div className="w-5 h-5 relative rounded-full bg-[#FFFC00] flex items-center justify-center p-0.5">
          <Image src="/LOGO.svg" alt="SNAP APP" width={16} height={16} />
        </div>
        <span className="text-xs font-bold text-white tracking-wide">
          SNAP APP
        </span>
      </div>

      {/* Center Hero */}
      <div className="max-w-md space-y-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#FFFC00] shadow-[0_0_50px_rgba(255,252,0,0.5)] mx-auto flex items-center justify-center p-4 transition-transform hover:scale-105 duration-300">
          <Image
            src="/LOGO.svg"
            alt="Snapchat Ghost"
            width={72}
            height={72}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Share Snaps with <br />
            <span className="text-[#FFFC00]">Consent-First</span> Location
          </h1>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
            Experience native Snapchat-style media sharing with transparent, verified geolocation consent and real-time operations mapping.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/admin/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-8 gap-2">
              <Sparkles className="w-4 h-4" />
              Admin Operations
            </Button>
          </Link>
          <Link href="/admin/images" className="w-full sm:w-auto">
            <Button variant="glass" size="lg" className="w-full sm:w-auto px-8 gap-2">
              <MapPin className="w-4 h-4 text-[#FFFC00]" />
              Create Snap
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex items-center gap-2 text-[11px] text-white/40">
        <ShieldCheck className="w-3.5 h-3.5 text-[#FFFC00]" />
        <span>Strict Privacy Disclosure • Non-Negotiable Consent</span>
      </div>
    </main>
  );
}
