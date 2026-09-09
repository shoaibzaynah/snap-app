// components/admin/AdminNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Plus,
  Link2,
  MapPin,
  Clock,
  Settings,
  LogOut,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/devices", label: "Kid Devices", icon: Smartphone },
  { href: "/admin/images", label: "Upload Snap", icon: Plus },
  { href: "/admin/links", label: "Share Links", icon: Link2 },
  { href: "/admin/locations", label: "Live Map", icon: MapPin },
  { href: "/admin/sessions", label: "Sessions", icon: Clock },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const BOTTOM_TABS = [
  { href: "/admin", label: "Dash", icon: LayoutDashboard },
  { href: "/admin/devices", label: "Kids", icon: Smartphone },
  { href: "/admin/links", label: "Links", icon: Link2 },
  { href: "/admin/locations", label: "Map", icon: MapPin },
];

export const AdminNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Sticky Header with iOS Safe Area Inset Support */}
      <header className="flex md:hidden sticky top-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 select-none pt-[env(safe-area-inset-top,0px)]">
        <div className="h-14 px-4 w-full flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFFC00] flex items-center justify-center p-1.5 shadow-lg shadow-yellow-500/25 ring-2 ring-[#FFFC00]/30">
              <Image src="/LOGO.svg" alt="Ghost Logo" width={20} height={20} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wide text-slate-900 dark:text-white leading-none">SNAP APP</span>
              <span className="text-amber-600 dark:text-[#FFFC00] text-[9px] font-bold uppercase tracking-wider mt-0.5">Admin</span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleGlobalRefresh}
              disabled={isRefreshing}
              title="Refresh All PWA Pages & Data"
              className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:text-white/60 dark:hover:text-[#FFFC00] dark:hover:bg-white/5 transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-amber-600 dark:text-[#FFFC00]")} />
            </button>
            <ThemeToggle />
            <Link href="/admin/settings" className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-all">
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={handleLogout} title="Sign Out" className="p-2 rounded-xl text-slate-500 hover:text-red-500 dark:text-white/60 dark:hover:text-red-400 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 bg-white dark:bg-[#0B0B0E] border-r border-slate-200 dark:border-white/10 flex-col justify-between shrink-0 select-none overflow-y-auto z-30">
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFFC00] flex items-center justify-center p-2 shadow-lg shadow-yellow-500/25 ring-2 ring-[#FFFC00]/30">
                <Image src="/LOGO.svg" alt="Ghost Logo" width={24} height={24} className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-black text-base tracking-wide text-slate-900 dark:text-white block leading-none">SNAP APP</span>
                <span className="text-amber-600 dark:text-[#FFFC00] text-[10px] font-bold uppercase tracking-wider">Admin System</span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGlobalRefresh}
                disabled={isRefreshing}
                title="Refresh All PWA Pages & Data"
                className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:text-white/60 dark:hover:text-[#FFFC00] dark:hover:bg-white/5 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-amber-600 dark:text-[#FFFC00]")} />
              </button>
              <ThemeToggle />
            </div>
          </div>
          <nav className="p-3 space-y-1.5 mt-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                    active
                      ? "bg-[#FFFC00] text-black font-bold shadow-lg shadow-yellow-500/20 translate-x-1"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 hover:translate-x-0.5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", active ? "text-black" : "text-slate-500 dark:text-white/60")} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex flex-col truncate pr-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">Admin Account</span>
            <span className="text-[11px] text-amber-700 dark:text-[#FFFC00]/80 font-mono truncate">
              {process.env.NEXT_PUBLIC_ADMIN_EMAIL || "shoaibzaynah@gmail.com"}
            </span>
          </div>
          <button onClick={handleLogout} title="Sign Out" className="p-2 rounded-xl text-slate-500 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Native Bottom Navigation Bar (PWA Style with Center Floating Create Button) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-[68px] bg-white/95 dark:bg-[#0B0B0E]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-3 items-center justify-between select-none pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
        {BOTTOM_TABS.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90",
              pathname === href ? "text-amber-600 dark:text-[#FFFC00] font-bold" : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">{label}</span>
          </Link>
        ))}

        {/* Center Floating Action Button: Create Snap */}
        <div className="flex items-center justify-center flex-1 -mt-5">
          <Link
            href="/admin/images"
            className="w-12 h-12 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shadow-lg shadow-yellow-500/30 ring-4 ring-white dark:ring-[#0B0B0E] active:scale-90 hover:scale-105 transition-all"
            title="Create New Link"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        </div>

        {BOTTOM_TABS.slice(2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90",
              pathname === href ? "text-amber-600 dark:text-[#FFFC00] font-bold" : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

