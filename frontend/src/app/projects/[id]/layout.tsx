"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Folder, Loader2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Project, ProjectState } from "@/lib/types";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<ProjectState, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  complete: "Complete",
};

const STATE_CLASS: Record<ProjectState, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const data = await api.getProject(projectId);
      setProject(data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load project";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-3 text-sm">Loading project…</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="text-center py-6 space-y-4">
            <p className="text-sm text-destructive">{error || "Project not found"}</p>
            <Button asChild variant="link">
              <Link href="/">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const created = new Date(project.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium break-words">
            {project.name}
          </span>
        </nav>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-balance">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {project.research_question}
            </p>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-1">
              <Badge
                variant="outline"
                className={cn("text-[10px]", STATE_CLASS[project.state])}
              >
                {STATE_LABEL[project.state]}
              </Badge>
              <span>·</span>
              <span>Stage {project.current_stage} of 6</span>
              {project.folder && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Folder className="size-3" />
                    {project.folder}
                  </span>
                </>
              )}
              <span>·</span>
              <span>Created {created}</span>
            </div>
          </div>
          <Button asChild variant="outline" size="lg" className="flex-shrink-0">
            <Link href={`/projects/${project.id}/agents`}>
              <Users />
              Manage Agents
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <PipelineCanvas project={project} />
      </div>

      {children}
    </div>
  );
}
