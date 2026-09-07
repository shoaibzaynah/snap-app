"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Link2,
  MapPin,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/images", label: "Upload Snap", icon: ImageIcon },
  { href: "/admin/links", label: "Share Links", icon: Link2 },
  { href: "/admin/locations", label: "Live Map", icon: MapPin },
  { href: "/admin/sessions", label: "Sessions", icon: Clock },
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
    <aside className="w-full md:w-64 bg-[#0B0B0E] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between shrink-0 select-none">
      {/* Top Header & Brand */}
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

        {/* Nav Links */}
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

      {/* Bottom Profile & Sign Out */}
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
  );
};
