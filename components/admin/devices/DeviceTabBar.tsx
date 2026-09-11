// components/admin/devices/DeviceTabBar.tsx
"use client";

import React from "react";

interface TabItem {
  id: string;
  label: string;
  icon: any;
}

interface Props {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
}

export const DeviceTabBar: React.FC<Props> = ({ tabs, activeTab, onSelectTab }) => {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 overflow-x-auto max-w-full no-scrollbar select-none">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelectTab(id)}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
            activeTab === id
              ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-md"
              : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white/5"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};
