"use client";

import { Lightbulb, Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-30 lg:hidden bg-background border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="size-6 bg-sidebar-primary rounded-md flex items-center justify-center">
            <Lightbulb className="size-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">Society of Researchers</span>
        </div>
      </div>
    </div>
  );
}
