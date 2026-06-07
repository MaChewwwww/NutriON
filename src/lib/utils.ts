import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBoldText(text: string): React.ReactNode[] | string {
  if (!text) return "";
  const parts = text.split("**");
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return React.createElement(
        "strong",
        { key: index, className: "font-black text-foreground" },
        part
      );
    }
    return part;
  });
}
