"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { Project, ProjectState } from "@/lib/types";

function statusColor(state: ProjectState): string {
  switch (state) {
    case "complete": return "bg-emerald-400";
    case "in_progress": return "bg-amber-400";
    default: return "bg-zinc-600";
  }
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => {});
  }, [pathname]); // refetch on navigation to pick up new projects

  const toggleFolder = useCallback((folder: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }, []);

  // Group by folder
  const grouped: Record<string, Project[]> = {};
  const ungrouped: Project[] = [];
  for (const p of projects) {
    if (p.folder) {
      (grouped[p.folder] ??= []).push(p);
    } else {
      ungrouped.push(p);
    }
  }
  const folderNames = Object.keys(grouped).sort();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-60 bg-[#0a0a0a] text-zinc-400 flex flex-col z-50 border-r border-zinc-800/50 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800/50">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Society of</h1>
              <h1 className="text-sm font-semibold text-white leading-tight">Researchers</h1>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 sidebar-scroll overflow-y-auto">
          {/* Home link */}
          <Link
            href="/"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
              pathname === "/"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            <HomeIcon className="w-4 h-4 flex-shrink-0" />
            Home
          </Link>

          {/* Projects section */}
          {projects.length > 0 && (
            <div className="mt-4">
              <p className="px-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
                Projects
              </p>

              {/* Folders */}
              {folderNames.map((folderName) => {
                const isCollapsed = collapsed.has(folderName);
                const folderProjects = grouped[folderName];
                return (
                  <div key={folderName} className="mb-1">
                    <button
                      onClick={() => toggleFolder(folderName)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-zinc-900 transition-colors"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <FolderIcon className="w-3.5 h-3.5" />
                      <span className="truncate">{folderName}</span>
                      <span className="ml-auto text-[10px] text-zinc-700">{folderProjects.length}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {folderProjects.map((p) => (
                          <ProjectLink key={p.id} project={p} pathname={pathname} onClose={onClose} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped projects */}
              {ungrouped.length > 0 && (
                <div className="space-y-0.5">
                  {ungrouped.map((p) => (
                    <ProjectLink key={p.id} project={p} pathname={pathname} onClose={onClose} />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* New Project button */}
        <div className="px-3 py-3 border-t border-zinc-800/50">
          <Link
            href="/projects/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Link>
        </div>
      </aside>
    </>
  );
}

function ProjectLink({ project, pathname, onClose }: { project: Project; pathname: string; onClose?: () => void }) {
  const isActive = pathname.startsWith(`/projects/${project.id}`);
  return (
    <Link
      href={`/projects/${project.id}`}
      onClick={onClose}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
        isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor(project.state)}`} />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}
