"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Folder,
  Home,
  Lightbulb,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Project, ProjectState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function statusColor(state: ProjectState): string {
  switch (state) {
    case "complete":
      return "bg-emerald-500";
    case "in_progress":
      return "bg-amber-500";
    default:
      return "bg-muted-foreground/40";
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
  }, [pathname]);

  const toggleFolder = useCallback((folder: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }, []);

  const grouped: Record<string, Project[]> = {};
  const ungrouped: Project[] = [];
  for (const p of projects) {
    if (p.folder) (grouped[p.folder] ??= []).push(p);
    else ungrouped.push(p);
  }
  const folderNames = Object.keys(grouped).sort();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-60 bg-sidebar text-sidebar-foreground flex flex-col z-50 border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="size-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Lightbulb className="size-4 text-sidebar-primary-foreground" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">Society of</h1>
              <h1 className="text-sm font-semibold">Researchers</h1>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-3 sidebar-scroll overflow-y-auto">
          <Link
            href="/"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Home className="size-4" />
            Home
          </Link>

          {projects.length > 0 && (
            <div className="mt-6">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
                Projects
              </p>

              {folderNames.map((folderName) => {
                const isCollapsed = collapsed.has(folderName);
                const folderProjects = grouped[folderName];
                return (
                  <div key={folderName} className="mb-1">
                    <button
                      onClick={() => toggleFolder(folderName)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    >
                      <ChevronRight
                        className={cn(
                          "size-3 transition-transform",
                          !isCollapsed && "rotate-90"
                        )}
                      />
                      <Folder className="size-3.5" />
                      <span className="truncate">{folderName}</span>
                      <span className="ml-auto text-[10px] text-sidebar-foreground/40">
                        {folderProjects.length}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {folderProjects.map((p) => (
                          <ProjectLink
                            key={p.id}
                            project={p}
                            pathname={pathname}
                            onClose={onClose}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {ungrouped.length > 0 && (
                <div className="space-y-0.5">
                  {ungrouped.map((p) => (
                    <ProjectLink
                      key={p.id}
                      project={p}
                      pathname={pathname}
                      onClose={onClose}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href="/projects/new" onClick={onClose}>
              <Plus />
              New Project
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}

function ProjectLink({
  project,
  pathname,
  onClose,
}: {
  project: Project;
  pathname: string;
  onClose?: () => void;
}) {
  const isActive = pathname.startsWith(`/projects/${project.id}`);
  return (
    <Link
      href={`/projects/${project.id}`}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full flex-shrink-0",
          statusColor(project.state)
        )}
      />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}
