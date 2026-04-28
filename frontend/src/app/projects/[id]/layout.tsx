"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">{project.name}</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {project.research_question}
            </p>
          </div>
          <Button asChild variant="outline" size="lg">
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
