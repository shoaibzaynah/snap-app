// components/admin/AdminNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  PlusCircle,
  Link2,
  MapPin,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/images", label: "Upload Snap", icon: PlusCircle },
  { href: "/admin/links", label: "Share Links", icon: Link2 },
  { href: "/admin/locations", label: "Live Map", icon: MapPin },
  { href: "/admin/sessions", label: "Sessions", icon: Clock },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/images", label: "Create", icon: PlusCircle },
  { href: "/admin/links", label: "Links", icon: Link2 },
  { href: "/admin/locations", label: "Map", icon: MapPin },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const AdminNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Native Top Header (Sticky) */}
      <header className="flex md:hidden sticky top-0 left-0 right-0 z-40 h-14 bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-white/10 px-4 items-center justify-between select-none">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FFFC00] flex items-center justify-center p-1 shadow-md shadow-yellow-500/20">
            <Image
              src="/LOGO.svg"
              alt="SNAP APP Ghost Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white">
            SNAP APP <span className="text-[#FFFC00] text-[10px] font-bold uppercase">Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 font-mono hidden sm:inline truncate max-w-[120px]">
            {process.env.NEXT_PUBLIC_ADMIN_EMAIL || "shoaibzaynah@gmail.com"}
          </span>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Vertical Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-[#0B0B0E] border-r border-white/10 flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FFFC00] flex items-center justify-center p-1 shadow-md shadow-yellow-500/20">
                <Image
                  src="/LOGO.svg"
                  alt="SNAP APP Ghost Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base tracking-wide text-white">
                SNAP APP <span className="text-[#FFFC00] text-xs font-semibold uppercase">Admin</span>
              </span>
            </Link>
          </div>

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#FFFC00] text-black font-bold shadow-lg shadow-yellow-500/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-white/60")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex flex-col truncate pr-2">
            <span className="text-xs font-bold text-white truncate">Admin Account</span>
            <span className="text-[11px] text-white/50 truncate">
              {process.env.NEXT_PUBLIC_ADMIN_EMAIL || "shoaibzaynah@gmail.com"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Native Bottom Navigation Bar (PWA Style) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#0B0B0E]/95 backdrop-blur-2xl border-t border-white/10 px-2 items-center justify-around select-none pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-90",
                isActive ? "text-[#FFFC00]" : "text-white/50 hover:text-white"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-xl transition-all",
                  isActive && "bg-[#FFFC00]/15"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-[#FFFC00]" : "text-white/60")} />
              </div>
              <span className={cn("text-[10px] font-semibold mt-0.5", isActive && "font-bold text-[#FFFC00]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
