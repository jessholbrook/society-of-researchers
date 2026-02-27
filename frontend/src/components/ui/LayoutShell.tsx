"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleClose = useCallback(() => setSidebarOpen(false), []);
  const handleToggle = useCallback(() => setSidebarOpen((prev) => !prev), []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar isOpen={sidebarOpen} onClose={handleClose} />
      <main className="flex-1 lg:ml-60 min-h-screen">
        <MobileHeader onMenuToggle={handleToggle} />
        {children}
      </main>
    </div>
  );
}
