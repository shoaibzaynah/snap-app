import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name = "Snap User", src, size = "md", className }) => {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-full p-[2px] bg-gradient-to-tr from-[#FFFC00] to-purple-500 shadow-md",
        sizeStyles[size],
        className
      )}
    >
      <div className="w-full h-full rounded-full bg-[#1C1C22] flex items-center justify-center overflow-hidden font-bold text-white">
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials || "👻"}</span>
        )}
      </div>
    </div>
  );
};
