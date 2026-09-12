// components/admin/LinkDetailHeaderActions.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImageLink } from "@/lib/types";
import { EditLinkModal } from "@/components/admin/EditLinkModal";
import { Edit3, Eye } from "lucide-react";

interface Props {
  link: ImageLink;
}

export const LinkDetailHeaderActions: React.FC<Props> = ({ link }) => {
  const router = useRouter();
  const [currentLink, setCurrentLink] = useState<ImageLink>(link);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaved = (updated: ImageLink) => {
    setCurrentLink(updated);
    setIsEditing(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
        <Button
          onClick={() => setIsEditing(true)}
          variant="secondary"
          size="sm"
          className="gap-1.5 h-8 sm:h-9 px-3 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-[#FFFC00] border-amber-500/30 dark:border-[#FFFC00]/30 font-bold transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Link</span>
        </Button>

        <Link href={`/view/${currentLink.slug}`} target="_blank">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 h-8 sm:h-9 px-3 text-xs border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Viewer</span>
          </Button>
        </Link>
      </div>

      {isEditing && (
        <EditLinkModal
          link={currentLink}
          onClose={() => setIsEditing(false)}
          onSave={handleSaved}
        />
      )}
    </>
  );
};
