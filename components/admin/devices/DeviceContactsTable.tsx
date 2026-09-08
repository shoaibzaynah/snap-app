// components/admin/devices/DeviceContactsTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import { DeviceContact } from "@/lib/device-types";
import { Input } from "@/components/ui/Input";
import { Search, Phone, User, Copy, Check } from "lucide-react";

interface Props {
  contacts: DeviceContact[];
}

export const DeviceContactsTable: React.FC<Props> = ({ contacts }) => {
  const [search, setSearch] = useState("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (Array.isArray(c.phone_numbers) &&
          c.phone_numbers.some((num) => num.includes(q)))
    );
  }, [contacts, search]);

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#FFFC00]" />
            Contacts Book ({contacts.length})
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Full phonebook synced directly from the child&apos;s device.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contact or number..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/50 text-xs">
          {contacts.length === 0
            ? "No contacts synced yet. They will appear here once the device connects."
            : "No contacts match your search."}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.01]">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                className="p-3.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FFFC00] font-bold text-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {contact.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {Array.isArray(contact.phone_numbers) &&
                        contact.phone_numbers.map((num, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <Phone className="w-2.5 h-2.5 text-white/40" />
                            {num}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {contact.phone_numbers?.[0] && (
                    <button
                      onClick={() => handleCopy(contact.phone_numbers[0])}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                      title="Copy Number"
                    >
                      {copiedNumber === contact.phone_numbers[0] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
